// src/utils/responseHelper.js
export const sendSuccess = (res, statusCodeOrOptions = 200, message = 'Success', data = null) => {
  let statusCode = 200;
  let msg = 'Success';
  let resData = null;

  // Nếu người viết truyền dạng Object: sendSuccess(res, { statusCode, message, data })[cite: 1]
  if (typeof statusCodeOrOptions === 'object' && statusCodeOrOptions !== null) {
    statusCode = Number(statusCodeOrOptions.statusCode) || 200;
    msg = statusCodeOrOptions.message || 'Success';
    resData = statusCodeOrOptions.data !== undefined ? statusCodeOrOptions.data : null;
  } else {
    // Nếu người viết truyền dạng tham số rời: sendSuccess(res, 200, 'Success', data)[cite: 1]
    statusCode = Number(statusCodeOrOptions) || 200;
    msg = message;
    resData = data;
  }

  const response = {
    success: true,
    message: msg,
  };

  if (resData !== null && resData !== undefined) {
    response.data = resData;
  }

  return res.status(statusCode).json(response);
};