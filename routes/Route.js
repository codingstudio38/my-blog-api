const express = require("express");
const routeapp = new express.Router();
const AgeAuth = require("./../middleware/AgeAuth");
const Auth = require("./../middleware/Auth");
const Mycontroller = require("./../Controllers/Mycontroller");
const Blogcontroller = require("./../Controllers/Blogcontroller");
const Homepagecontroller = require("./../Controllers/Homepagecontroller");
const FindFriends = require("./../Controllers/FindFriends");
const AllNotificationController = require("./../Controllers/AllNotificationController");
const UsersFriendRequestController = require("./../Controllers/UsersFriendRequestController");
routeapp.get('/', async (req, resp) => {
    return resp.status(200).json({ "status": 200, "message": "Success" });
})
routeapp.post('/create-user', Mycontroller.CreateUser)
routeapp.post('/user-login', Mycontroller.Userlogin)
routeapp.post('/user-logout', Auth, Mycontroller.UserLogout)
routeapp.post('/update-user', Auth, Mycontroller.UpdateUser)
routeapp.post('/update-user-photo', Auth, Mycontroller.UpdateUserPhoto)
routeapp.get('/users', Auth, Mycontroller.Users)
routeapp.post('/user-byid/:id', Auth, Mycontroller.UserByid)
routeapp.post('/blog-cetegory-list', Auth, Blogcontroller.BlogsCategoryList)
routeapp.post('/upload-blog-images', Auth, Blogcontroller.UplodePhoto)
routeapp.post('/upload-blog-thumbnail', Auth, Blogcontroller.UplodeThumbnail)
routeapp.post('/create-blog', Auth, Blogcontroller.CreactBlog)
routeapp.post('/my-blogs', Auth, Blogcontroller.Myblogs)
routeapp.post('/ckeditor', Auth, Mycontroller.CkeditorfileUpload)
routeapp.post('/delete-blogs/:id', Auth, Blogcontroller.DeleteBlogByid)
routeapp.post('/blog-byid/:id', Auth, Blogcontroller.BlogByid)
routeapp.post('/update-blog', Auth, Blogcontroller.UpdateBlog)
routeapp.post('/all-blogs', Auth, Homepagecontroller.Allblogs)
routeapp.post('/find-friends', Auth, FindFriends.AllUsers)
routeapp.post('/send-request', Auth, UsersFriendRequestController.SendRequest)
routeapp.post('/cencel-request', Auth, UsersFriendRequestController.CencelRequest)
routeapp.post('/accept-or-reject-request', Auth, UsersFriendRequestController.AcceptOrRejectRequest)
routeapp.post('/delete-friend', Auth, UsersFriendRequestController.DeleteFriend)
routeapp.post('/all-notifications', Auth, AllNotificationController.AllNotifications)
routeapp.post('/read-notification', Auth, AllNotificationController.ReadThis)
routeapp.post('/my-friends', Auth, FindFriends.MyFriends)
routeapp.all(/.*/, async (req, res) => {
    res.status(404).json({ status: 404, message: "route not found..!!" });
});
module.exports = routeapp;
