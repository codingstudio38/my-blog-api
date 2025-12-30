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
const VideoPlayerController = require("./../Controllers/VideoPlayerController");
const ChatController = require("./../Controllers/ChatController");
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
routeapp.post('/blog-byalias/:id', Auth, Blogcontroller.BlogByAlias)
routeapp.post('/update-blog', Auth, Blogcontroller.UpdateBlog)
routeapp.post('/all-blogs', Auth, Homepagecontroller.Allblogs)
routeapp.post('/find-friends', Auth, FindFriends.AllUsers)
routeapp.post('/my-friends', Auth, FindFriends.MyFriends)
routeapp.post('/my-friends-for-share', Auth, FindFriends.MyFriendsForShare)
routeapp.post('/friend-rquest-already-send', Auth, FindFriends.FriendRequestSendList)
routeapp.post('/new-friend-request-list', Auth, FindFriends.NewFriendRequestList)
routeapp.post('/send-request', Auth, UsersFriendRequestController.SendRequest)
routeapp.post('/cencel-request', Auth, UsersFriendRequestController.CencelRequest)
routeapp.post('/accept-or-reject-request', Auth, UsersFriendRequestController.AcceptOrRejectRequest)
routeapp.post('/delete-friend', Auth, UsersFriendRequestController.DeleteFriend)
routeapp.post('/all-notifications', Auth, AllNotificationController.AllNotifications)
routeapp.post('/read-notification', Auth, AllNotificationController.ReadThis)
routeapp.get("/video-player", Auth, VideoPlayerController.NodeJSStreams);//video blob url
routeapp.get("/video", VideoPlayerController.NodeJSStreams_OLD);
routeapp.post('/upload-chat-file', Auth, ChatController.UploadChatFile);
routeapp.post("/save-user-chat", Auth, ChatController.SaveChat);
routeapp.post('/chat-list', Auth, ChatController.ChatList);
routeapp.post('/find-chat', Auth, ChatController.FindChat);
routeapp.post("/update-read-status", Auth, ChatController.UpdateUnreadMessage);
routeapp.post("/clear-all-notifications", Auth, AllNotificationController.ClearAll);
routeapp.post("/video-thumbnail", Auth, VideoPlayerController.VideothumbnailNew);
routeapp.post("/like-and-dislike", Auth, Blogcontroller.LikeAndDislike);
routeapp.post("/user-blog-comment", Auth, Blogcontroller.UserComment);
routeapp.post("/blog-comment", Auth, Blogcontroller.Comment);
routeapp.post("/blog-comment-list", Auth, Blogcontroller.CommentList);
routeapp.post("/hide-blog-comment", Auth, Blogcontroller.hideComments);
routeapp.post("/update-blog-archive", Auth, Blogcontroller.UpdateBlogArchive);
routeapp.post("/share-blog", Auth, Blogcontroller.ShareBlog);
routeapp.post("/share-blog-to-friends", Auth, Blogcontroller.ShareBlogToFriends);
routeapp.post("/like-and-dislike-on-sharepost", Auth, Blogcontroller.LikeAndDislikeOnSharePost);
routeapp.post("/comment-on-sharepost", Auth, Blogcontroller.CommentOnSharePost);
routeapp.post("/update-blog-settings", Auth, Blogcontroller.UpdateBlogSetting);
routeapp.post("/blog-share-list", Auth, Blogcontroller.ShareList);
routeapp.all(/.*/, async (req, res) => {
    res.status(404).json({ status: 404, message: "route not found..!!" });
});
module.exports = routeapp;
