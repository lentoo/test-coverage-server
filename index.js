// 1. 补充任务状态流程

const express = require('express');
const fs = require('fs');
const child_process = require('child_process');

const server = express();

let currentTest = null;
let counter = 1;
const PORT = 3000;

// 1. 开始测试
server.post('/start-collect', (req, res) => {
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
  currentTest = {
    branch: req.body.branch,
    commitHash: req.body.commitHash,
    project: req.body.project,
    start: req.body.start,
    type: req.body.type,
    taskId: req.body.taskId,
  };
});

// 2. 接收数据

server.post('/collect', (req, res) => {
  /**
   * // kirin-wxapp/pre/@latest/1664196007_1.json
   *  {
   *    type: 'all',
   *    data: FromNyc  // nyc原本结构
   *  }
   */
  if (!currentTest) {
    res.send({
      data: null,
      code: 500,
      success: false,
    });
    res.end();
    return;
  }
  const body = req.body;
  const filepath = `${currentTest.project}/${currentTest.branch}/${
    currentTest.commitHash
  }/${currentTest.start}_${counter++}.json`;
  saveData(body.data, filepath);
  res.send({
    data: body.data,
    code: 200,
    success: true,
  });
  res.end();
});

// 3. 结束测试

server.post('/end-collect', (req, res) => {
  execMerge();
  execReport();
});

server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

function saveData(data, filepath) {
  try {
    fs.writeFileSync(filepath, data);
  } catch (error) {
    console.log(filepath);
    console.log(error);
  }
}

function execMerge() {
  const filepath = `${currentTest.project}/${currentTest.branch}/${currentTest.commitHash}/${currentTest.start}.json`;
  const fileDirectory = `${currentTest.project}/${currentTest.branch}/${currentTest.commitHash}`;
  // child_prcess.execSync(`cli-test merge ${fileDirectory} ${filepath}`);
  useExec(`cli-test merge ${fileDirectory} ${filepath}`).then((res) => {
    console.log('merge 完成');
  });
}

function execReport() {
  const fileDirectory = `${currentTest.project}/${currentTest.branch}/${currentTest.commitHash}`;
  useExec(`cli-test report ${fileDirectory}/report`).then((res) => {
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
