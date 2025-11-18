async function AgeAuth(req, resp, next) {
    try {
        const _token = req.query.age;
        var allowlist = ['http://localhost:4200', 'http://localhost:3000'];
        // if (allowlist.indexOf(req.header('Origin')) == -1) {
        //     return resp.status(400).json({ "status": 400, "message": "Access denied..!!" });
        // } 
        if (!_token) {
            return resp.status(401).json({ "status": 401, "message": "Unauthorized" });
        }

        req.user = _token;
        next();
    } catch (error) {
        return resp.status(401).json({ "status": 401, "message": "Failed..!!", "error": error.message });
    }
}
module.exports = AgeAuth;