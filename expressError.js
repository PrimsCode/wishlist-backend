// ExpressError extends normal JS error to add a status
 class ExpressError extends Error {
    constructor(msg, status) {
      super();
      this.message = msg;
      this.status = status;
    }
  }
  
//404 NOT FOUND
  class NotFoundError extends ExpressError {
    constructor(msg = "Not Found") {
      super(msg, 404);
    }
  }
  
//401 UNAUTHORIZED
  class UnauthorizedError extends ExpressError {
    constructor(msg = "Unauthorized") {
      super(msg, 401);
    }
  }
  
 //400 BAD REQUEST 
  class BadRequestError extends ExpressError {
    constructor(msg = "Bad Request") {
      super(msg, 400);
    }
  }
  
 //403 FORBIDDEN - BAD REQUEST 
  class ForbiddenError extends ExpressError {
    constructor(msg = "Bad Request") {
      super(msg, 403);
    }
  }
  
  module.exports = {
    ExpressError,
    NotFoundError,
    UnauthorizedError,
    BadRequestError,
    ForbiddenError,
  };