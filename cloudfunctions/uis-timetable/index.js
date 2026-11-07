'use strict';
const { loginAndFetchTimetable } = require('./uis');
const cloud = require('@cloudbase/node-sdk');

/**
 * UIS 登录 + 拉课表云函数入口
 * event: { studentId, password, userId }
 * 密码只在本函数内用一次，不落库、不打日志。
 */
exports.main = async (event) => {
  const { studentId, password, userId } = event || {};
  if (!studentId || !password) {
    return { ok: false, error: '缺少 studentId 或 password' };
  }

  try {
    const { courses } = await loginAndFetchTimetable(studentId, password);

    const app = cloud.init({ env: cloud.SYMBOL_CURRENT_ENV });
    const db = app.database();

    // 先删旧记录再写入，保证每人一份最新课表
    if (userId) {
      await db.collection('courses').where({ userId }).remove();
    }
    const addRes = await db.collection('courses').add({
      userId: userId || null,
      studentId,
      courses,
      fetched_at: Date.now(),
    });

    return { ok: true, count: courses.length, docId: addRes.id };
  } catch (e) {
    return { ok: false, type: e.type || 'unknown', error: e.message };
  }
};
