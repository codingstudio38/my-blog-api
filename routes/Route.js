import express from "express";

// import AgeAuth from "../middleware/AgeAuth.js";
import Auth from "../middleware/Auth.js";

import { CreateUser, Userlogin, UserLogout, UpdateUser, UpdateUserPhoto, Users, UserByid, CkeditorfileUpload } from "../Controllers/Mycontroller.js";
import { BlogsCategoryList, UplodePhoto, UplodeThumbnail, BlogByAlias, UpdateBlog, LikeAndDislike, UserComment, Comment, CommentList, hideComments, UpdateBlogArchive, ShareBlog, ShareBlogToFriends, LikeAndDislikeOnSharePost, CommentOnSharePost, UpdateBlogSetting, ShareList, UpdateBlogPublishStatus, CreactBlog, Myblogs, DeleteBlogByid, BlogByid } from "../Controllers/Blogcontroller.js";
import { Allblogs } from "../Controllers/Homepagecontroller.js";
import { AllUsers, MyFriends, MyFriendsForShare, FriendRequestSendList, NewFriendRequestList } from "../Controllers/FindFriends.js";
import { AllNotifications, ReadThis, ClearAll } from "../Controllers/AllNotificationController.js";
import { SendRequest, CencelRequest, AcceptOrRejectRequest, DeleteFriend } from "../Controllers/UsersFriendRequestController.js";
import { NodeJSStreams, NodeJSStreams_OLD, VideothumbnailNew, VideothumbnailV2, VideothumbnailMetaData } from "../Controllers/VideoPlayerController.js";
import { UploadChatFile, SaveChat, ChatList, FindChat, UpdateUnreadMessage } from "../Controllers/ChatController.js";
import { PaginationData, generateRandomString, storageFolderPath, FileInfo, DeleteFile, FileExists, data_decrypt, data_encrypt } from "../Controllers/Healper.js";

const routeapp = express.Router();
// const { Server } = require("@tus/server");
// const { FileStore } = require("@tus/file-store");
// const tusServer = new Server({
//     path: `${Healper.storageFolderPath()}uploads`,
//     datastore: new FileStore({
//         directory: `${Healper.storageFolderPath()}uploads`
//     })
// });
routeapp.get("/", async (req, resp) => {
    return resp.status(200).json({
        status: 200,
        message: "Success"
    });
});

routeapp.post("/create-user", CreateUser);
routeapp.post("/user-login", Userlogin);
routeapp.post("/user-logout", Auth, UserLogout);
routeapp.post("/update-user", Auth, UpdateUser);
routeapp.post("/update-user-photo", Auth, UpdateUserPhoto);
routeapp.get("/users", Auth, Users);
routeapp.post("/user-byid/:id", Auth, UserByid);

routeapp.post("/blog-cetegory-list", Auth, BlogsCategoryList);
routeapp.post("/upload-blog-images", Auth, UplodePhoto);
routeapp.post("/upload-blog-thumbnail", Auth, UplodeThumbnail);
routeapp.post("/create-blog", Auth, CreactBlog);
routeapp.post("/my-blogs", Auth, Myblogs);
routeapp.post("/ckeditor", Auth, CkeditorfileUpload);
routeapp.post("/delete-blogs/:id", Auth, DeleteBlogByid);
routeapp.post("/blog-byid/:id", Auth, BlogByid);
routeapp.post("/blog-byalias/:id", Auth, BlogByAlias);
routeapp.post("/update-blog", Auth, UpdateBlog);
routeapp.post("/all-blogs", Auth, Allblogs);

routeapp.post("/find-friends", Auth, AllUsers);
routeapp.post("/my-friends", Auth, MyFriends);
routeapp.post("/my-friends-for-share", Auth, MyFriendsForShare);
routeapp.post("/friend-rquest-already-send", Auth, FriendRequestSendList);
routeapp.post("/new-friend-request-list", Auth, NewFriendRequestList);

routeapp.post("/send-request", Auth, SendRequest);
routeapp.post("/cencel-request", Auth, CencelRequest);
routeapp.post("/accept-or-reject-request", Auth, AcceptOrRejectRequest);
routeapp.post("/delete-friend", Auth, DeleteFriend);

routeapp.post("/all-notifications", Auth, AllNotifications);
routeapp.post("/read-notification", Auth, ReadThis);
routeapp.post("/clear-all-notifications", Auth, ClearAll);

routeapp.get("/video-player", Auth, NodeJSStreams);
routeapp.get("/video", NodeJSStreams_OLD);

routeapp.post("/upload-chat-file", Auth, UploadChatFile);
routeapp.post("/save-user-chat", Auth, SaveChat);
routeapp.post("/chat-list", Auth, ChatList);
routeapp.post("/find-chat", Auth, FindChat);
routeapp.post("/update-read-status", Auth, UpdateUnreadMessage);

routeapp.post("/video-thumbnail", Auth, VideothumbnailNew);
routeapp.get("/video-thumbnail-v2", VideothumbnailV2);
routeapp.post("/video-thumbnail-metadata", Auth, VideothumbnailMetaData);

routeapp.post("/like-and-dislike", Auth, LikeAndDislike);
routeapp.post("/user-blog-comment", Auth, UserComment);
routeapp.post("/blog-comment", Auth, Comment);
routeapp.post("/blog-comment-list", Auth, CommentList);
routeapp.post("/hide-blog-comment", Auth, hideComments);
routeapp.post("/update-blog-archive", Auth, UpdateBlogArchive);
routeapp.post("/share-blog", Auth, ShareBlog);
routeapp.post("/share-blog-to-friends", Auth, ShareBlogToFriends);
routeapp.post("/like-and-dislike-on-sharepost", Auth, LikeAndDislikeOnSharePost);
routeapp.post("/comment-on-sharepost", Auth, CommentOnSharePost);
routeapp.post("/update-blog-settings", Auth, UpdateBlogSetting);
routeapp.post("/blog-share-list", Auth, ShareList);
routeapp.post("/update-blog-publish-status", Auth, UpdateBlogPublishStatus);

// 404 handler
routeapp.all(/.*/, async (req, res) => {
    res.status(404).json({
        status: 404,
        message: "route not found..!!"
    });
});

export default routeapp;
