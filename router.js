const RedisUtils = require('./utils/redis');
const fs = require('fs');
const express = require('express');
const child_process = require('child_process');
const path = require('path');
const makeDir = require('make-dir');
const exec = child_process.exec;

const STATUS = {
  START: 'START',
  TESTING: 'TESTING',
  REPORTER_GENERATION: 'REPORTER_GENERATION', // 报告生成中
  DONE: 'DONE', // 报告生成中
};
function saveData(data, filepath) {
  try {
    fs.writeFileSync(filepath, data);
  } catch (error) {
    console.log(filepath);
    console.log(error);
  }
}

async function execMerge(taskJson) {
  // const currentTest = taskJson
  const filepath = path.resolve(
    process.cwd(),
    `./files/${taskJson.project}/${taskJson.branch}/${taskJson.commitHash}/${taskJson.start}.json`
  );
  // const filepath = `${currentTest.project}/${currentTest.branch}/${currentTest.commitHash}/${currentTest.start}.json`;
  const fileDirectory = path.dirname(filepath);
  // child_prcess.execSync(`cli-test merge ${fileDirectory} ${filepath}`);
  return useExec(`npx cli-test merge ${fileDirectory} ${filepath}`).then(
    (res) => {
      console.log('merge 完成');
    }
  );
}

async function execReport(taskJson) {
  // const currentTest = taskJson
  const filepath = path.resolve(
    process.cwd(),
    `./files/${taskJson.project}/${taskJson.branch}/${taskJson.commitHash}/${taskJson.start}.json`
  );
  const fileDirectory = path.dirname(filepath);
  // const fileDirectory = `${currentTest.project}/${currentTest.branch}/${currentTest.commitHash}`;
  await makeDir(`${fileDirectory}/report`);
  // cli-test report ./out --reporter=html --project-id=575 --ref=test --private-token=e3wTHCndxrV2vcvXx-Px
  return useExec(
    `npx cli-test report ${fileDirectory} ${fileDirectory}/report --reporter=html --project-id=575 --ref=test --private-token=e3wTHCndxrV2vcvXx-Px`
  ).then((res) => {
    console.log('report 导出完成');
  });
}

function useExec(shell) {
  return new Promise((res, rej) => {
    exec(shell, (err, stdout, stderr) => {
      if (err) rej(err);
      res({
        stdout,
        stderr,
      });
    });
  });
}

function getTaskKey(taskId) {
  return `task.${taskId}`;
}

module.exports = function useRouter(server) {
  server.get('/', (req, res) => {
    res.send('hello!');
    res.end();
    return;
  });

  /**
   * 挂载静态资源
   */
  server.use('/reports', express.static('files'));

  // 1. 开始测试
  server.post('/start-collect', async (req, res) => {
    /**
   * 平台发送的结构体
   * {
        branch: 'origin/test',
        commitHash '3e324ktrt', //前xx位
        project: 'kirin-mgr',
        start: '1664196007', // 时间戳到秒
        type: 'all', // all || Incremental
        taskId: '13324', // 平台提供id
      }
   */

    const body = req.body;

    if (!req.body.taskId) {
      res.send({
        data: '参数异常',
        code: 200,
        success: false,
      });
      res.end();
      return;
    }

    const taskKey = getTaskKey(req.body.taskId);
    const result = await RedisUtils.getKey(taskKey);
    if (result) {
      if (result.status === 'DONE') {
        res.send({
          message: `当前task id 已完成`,
          code: 200,
          success: false,
        });
        res.send();
        return;
      }
      res.send({
        message: `当前task id 已存在`,
        code: 200,
        success: false,
      });
      res.send();
      return;
    }

    await RedisUtils.setValue(taskKey, {
      ...body,
      status: 'START',
    });

    res.send({
      data: body.data,
      code: 200,
      success: true,
    });
    res.end();
  });

  // 2. 接收数据

  server.post('/collect', async (req, res) => {
    /**
     * // kirin-wxapp/pre/@latest/1664196007_1.json
     *  {
     *    type: 'all',
     *    data: FromNyc  // nyc原本结构
     *  }
     */
    const taskId = getTaskKey(req.body.taskId);
    let taskJson = await RedisUtils.getKey(taskId);
    if (!taskJson) {
      res.send({
        message: `taskId ${req.body.taskId} 不存在`,
        code: 200,
        success: false,
      });
      res.end();
      return;
    }

    // taskJson = JSON.parse(taskJson);
    if (![STATUS.START, STATUS.TESTING].includes(taskJson.status)) {
      res.send({
        message: `taskId ${req.body.taskId} 任务状态 ${taskJson.status} 不可上报`,
        code: 200,
        success: false,
      });
      res.end();
      return;
    }
    console.log(taskJson);
    taskJson.counter = taskJson.counter || 0;

    taskJson.status = STATUS.TESTING; // 測試中

    const body = req.body;
    const filepath = path.resolve(
      process.cwd(),
      `./files/${taskJson.project}/${taskJson.branch}/${taskJson.commitHash}/${
        taskJson.start
      }_${taskJson.counter++}.json`
    );
    const dirname = path.dirname(filepath);
    console.log(dirname);
    await makeDir(dirname);
    saveData(body.data, filepath);
    await RedisUtils.setValue(`task.${req.body.taskId}`, taskJson);
    res.send({
      data: body.data,
      code: 200,
      success: true,
    });
    res.end();
  });

  // 3. 结束测试

  server.post('/end-collect', async (req, res) => {
    const taskKey = getTaskKey(req.body.taskId);
    let taskJson = await RedisUtils.getKey(taskKey);
    if (!taskJson) {
      res.send({
        message: `taskId ${req.body.taskId} 不存在`,
        code: 200,
        success: false,
      });
      res.end();
      return;
    }
    // taskJson = JSON.parse(taskJson);

    // taskJson.status ='END' // 測試中
    // await RedisUtils.setValue(`task.${req.body.taskId}`, taskJson)
    taskJson.status = STATUS.REPORTER_GENERATION; // 报告生成中
    await RedisUtils.setValue(taskKey, taskJson);

    await execMerge(taskJson);
    await execReport(taskJson);
    taskJson.status = STATUS.DONE; // 报告生成完成
    await RedisUtils.setValue(taskKey, taskJson);
    res.send({
      message: 'success',
      data: 'taskId:' + req.body.taskId,
      code: 200,
      success: true,
    });
    res.end();
  });
};
