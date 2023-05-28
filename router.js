const RedisUtils = require('./utils/redis');
const fs = require('fs');
const child_process = require('child_process');
const path = require('path');
const makeDir = require('make-dir');
const exec = child_process.exec;
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
    `./files/${taskJson.project}/${taskJsnon.branch}/${taskJson.commitHash}/${taskJson.start}.json`
  );
  const fileDirectory = path.dirname(filepath);
  // const fileDirectory = `${currentTest.project}/${currentTest.branch}/${currentTest.commitHash}`;
  await makeDir(`${fileDirectory}/report`);
  return useExec(
    `npx cli-test report ${fileDirectory} ${fileDirectory}/report`
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

module.exports = function useRouter(server) {
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

    await RedisUtils.setValue(`task.${req.body.taskId}`, {
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
    let taskJson = await RedisUtils.getKey('task.' + req.body.taskId);
    if (!taskJson) {
      res.send({
        message: `taskId ${req.body.taskId} 不存在`,
        code: 200,
        success: false,
      });
      res.end();
      return;
    }
    taskJson = JSON.parse(taskJson);
    console.log(taskJson);
    taskJson.counter = taskJson.counter || 0;

    taskJson.status = 'TESTING'; // 測試中

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
    let taskJson = await RedisUtils.getKey('task.' + req.body.taskId);
    if (!taskJson) {
      res.send({
        message: `taskId ${req.body.taskId} 不存在`,
        code: 200,
        success: false,
      });
      res.end();
      return;
    }
    taskJson = JSON.parse(taskJson);

    // taskJson.status ='END' // 測試中
    // await RedisUtils.setValue(`task.${req.body.taskId}`, taskJson)
    taskJson.status = 'REPORTER_GENERATION'; // 报告生成中
    await RedisUtils.setValue(`task.${req.body.taskId}`, taskJson);

    await execMerge(taskJson);
    await execReport(taskJson);
    res.send({
      message: 'success',
      data: req.body.taskId,
      code: 200,
      success: true,
    });
    res.end();
  });
};
