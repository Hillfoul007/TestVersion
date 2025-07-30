const detailedLogger = (req, res, next) => {
  const start = Date.now();
  
  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0
    };
    
    // Log with emoji indicators for better visibility
    const statusEmoji = res.statusCode >= 500 ? '❌' : 
                       res.statusCode >= 400 ? '⚠️' : 
                       res.statusCode >= 300 ? '🔄' : '✅';
    
    console.log(`${statusEmoji} ${logData.method} ${logData.url} | ${logData.statusCode} | ${logData.duration} | ${logData.ip}`);
    
    // Log additional details for errors
    if (res.statusCode >= 400) {
      console.log(`   📍 Error Details: ${req.method} ${req.originalUrl}`);
      console.log(`   👤 User-Agent: ${req.get('User-Agent')}`);
      if (req.body && Object.keys(req.body).length > 0) {
        console.log(`   📦 Request Body: ${JSON.stringify(req.body, null, 2)}`);
      }
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = detailedLogger;
