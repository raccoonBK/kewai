'use strict';
// 本地端到端测试：node test.js <学号> <密码>
const { loginAndFetchTimetable } = require('./uis');

const studentId = process.argv[2];
const password = process.argv[3];

if (!studentId || !password) {
  console.log('用法: node test.js <学号> <UIS密码>');
  process.exit(1);
}

(async () => {
  console.log('开始登录并拉取课表...');
  try {
    const { courses, raw } = await loginAndFetchTimetable(studentId, password);
    console.log('\n登录成功，课表条数:', courses.length);
    console.log('学生课表数(studentTableVms):', (raw.studentTableVms || []).length);
    console.log('\n--- 前 5 条课程 ---');
    for (const c of courses.slice(0, 5)) {
      console.log(`  ${c.name} | 周${c.weekday} 第${c.startUnit}-${c.endUnit}节 | ${c.location} | 教师:${c.teachers.join(',')}`);
    }
  } catch (e) {
    console.error('\n失败:', e.name, '|', e.message);
    process.exit(1);
  }
})();
