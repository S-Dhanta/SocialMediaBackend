import { createPool } from "mysql2/promise";
import { v4 as uuidv4 } from 'uuid';
import { currentUser } from "../controllers/UserControllers";


//Create MySQL pool for executing queries
const pool = createPool({
    host:"localhost",
    user:"root",
    password:"sql4data@Dhanta4Saatvik",
    database: "socialmediadatabase",
    connectionLimit: 10,
});

//Class feed that will be used to contain methods related to the fedd of the platform
export default class Feed{
    //Contructor accepts only parameters that nedd manual attention. Rest will be genrated by sql or have default value.
    constructor({mediaUrl, content, commentAllow}) {
        this.mediaUrl = mediaUrl;
        this.content = content;
        this.commentAllow = commentAllow;
    }

    //Function to find all posts for the current user
    static async find(){
        //Get all following list as 'followedIds'.
        const [result] = await pool.query(`select followed_id from follows where follower_id=?`,[currentUser]);
        const followedIds = result.map(row => row.followed_id);
        followedIds.push(currentUser);

        //Get all posts with the user_id's present in 'followedIds' i.e. get all posts from yourself and the people you follow.
        const [rows] = await pool.query('SELECT * FROM posts where user_id in (?)',[followedIds]);
        return rows;
    }

    //Function to create a new post.
    static async CreateNewPost(mediaUrl,content,commentAllow){
        //Generate a new UUID number using library
        const postID=uuidv4();

        //Query for creating new post and adding it in 'post' table in the database.
        await pool.query(`INSERT INTO posts(post_id, user_id, media_url, content, comments_allow) VALUES(?, ?, ?, ?, ?)`,[postID,currentUser,mediaUrl,content,commentAllow]);

        //return the newly created post details.
        const [rows] = await pool.query(`select * from posts where post_id=?`,[postID]);
        return rows;
    }

    //Function to Update a post.
    static async findByIdAndUpdate(pID, content, mediaUrl){
        //Retreive the owner of the post.
        const [result]=await pool.query(`select user_id from posts where post_id=?`,[pID]);
        if(!result || result.length===0){
            return -2;
        }
        //Check if the owner of the post is the same as current user as you should not be able to edit someone else's posts.
        else if(result[0].user_id!=currentUser){
            return -1;
        }
        //Update the data in the database.
        await pool.query(`UPDATE posts SET content=?,media_url=? WHERE post_id=?`,[content,mediaUrl,pID]);
        const [rows] = await pool.query(`SELECT * FROM posts WHERE post_id=?`,[pID]);
        return rows;
    }

    //Function to retrieve a specific post only.
    static async findById(pID){
        //Check if the current user follows the owner of the post.
        const [result1] = await pool.query(`select followed_id from follows where follower_id=?`,[currentUser]);
        const followedIds = result1.map(row => row.followed_id);
        followedIds.push(currentUser);
        const [result]=await pool.query(`select user_id from posts where post_id=?`,[pID]);
        if(!result || result.length===0){
            return -2;
        }
        //If he does not, then return.
        if(!followedIds.includes(result[0].user_id)){
            return -1;
        }

        //If he follows then return the data of the post.
        const [rows] = await pool.query(`SELECT * from posts where post_id=?`,[pID]);
        
        //Adding the comments in the post description.
        const ans = rows[0];
        const [commentRows] = await pool.query('SELECT * FROM comments WHERE post_id = ?', [pID]);
        ans.comments=commentRows;
        return rows;
    }

    //Function to Delete a post.
    static async findByIdAndRemove(pID){
        //Check if post exists.
        const [result] = await pool.query(`select * from posts where post_id=? and user_id=?`,[pID,currentUser]);

        //If not return with special value.
        if(!result || result.length===0){
            return -1;
        }

        //If result has some value that means post exists and then delete it from the database.
        await pool.query(`delete from posts where post_id=? and user_id=?`,[pID,currentUser]);

        //If delete is successful then return rows which will be empty.
        const [rows] = await pool.query(`select * from posts where post_id=?`,[pID]);
        return rows;
    }

    //Method for adding "Like" to post by updating the "likes" table.
    static async likingPost(pID){
        //Check whether post already liked.
        const [rows1] = await pool.query(`SELECT * from likes where user_id=? and post_id=?`,[currentUser,pID]);

        //If yes then return and print appropriate msg.
        if(rows1.length!=0){
            return -3;
        }

        //Get the 'following' list of current user as array i.e. "followedIds".
        const [result1] = await pool.query(`select followed_id from follows where follower_id=?`,[currentUser]);
        const followedIds = result1.map(row => row.followed_id);
        followedIds.push(currentUser);
        const [result]=await pool.query(`select user_id from posts where post_id=?`,[pID]);

        //If result is empty that means no post exists with that post_id.
        if(!result || result.length===0){
            return -2;
        }

        //If user of the post is not in the following of the current user then we cannot proceed further as you cannot like the post of someone you do no follow.
        if(!followedIds.includes(result[0].user_id)){
            return -1;
        }

        //Now add the user_id and post_id to likes table to store it as record for the likes of a specific post by a specific user.
        await pool.query(`insert into likes(user_id, post_id) values(?,?)`,[currentUser, pID]);

        //Get the corresponding value from 'likes' table. If rows is empty that means the post has not been liked.
        const [rows] = await pool.query(`SELECT * from likes where user_id=? and post_id=?`,[currentUser,pID]);
        return rows;
    }
    static async updateAddLikes(pID){
        //Get the value of previous like count and increment it by 1.
        const [num] = await pool.query(`select likes_num from posts where post_id=?`,[pID]);
        let count=num[0].likes_num+1;

        //Update it in the 'posts' table where the total number of likes can be seen.
        const [rows] = await pool.query(`update posts set likes_num=? where post_id=?`,[count,pID]);
        return rows;
    }
    static async unlikePost(pID){
        //Get the 'following' list of current user as array i.e. "followedIds".
        const [result1] = await pool.query(`select followed_id from follows where follower_id=?`,[currentUser]);
        const followedIds = result1.map(row => row.followed_id);
        followedIds.push(currentUser);
        const [result]=await pool.query(`select user_id from posts where post_id=?`,[pID]);

        //If result is empty that means no post exists with that post_id.
        if(!result || result.length===0){
            return -2;
        }

        //If user of the post is not in the following of the current user then we cannot proceed further as you cannot unlike the post of someone you do no follow.
        if(!followedIds.includes(result[0].user_id)){
            return -1;
        }

        //Check whether the post has been liked. You cannot unlike a post that has never been liked.
        const [rows1] = await pool.query(`SELECT * from likes where user_id=? and post_id=?`,[currentUser,pID]);

        //If rows is empty, the post is not liked.
        if(rows1.length==0){
            return -3;
        }

        //Delete the data for this like form 'likes' table to unlike.
        await pool.query(`delete from likes where user_id=? and post_id=?`,[currentUser,pID]);

        //Check if deleted back in controller. Rows will be empty if like data deleted.
        const [rows] = await pool.query(`select * from likes where user_id=? and post_id=?`,[currentUser,pID]);
        return rows;
    }
    static async updateSubtractLikes(pID){
        //Get the value of previous like count and decrement it by 1.
        const [num] = await pool.query(`select likes_num from posts where post_id=?`,[pID]);
        let count=num[0].likes_num-1;

        //Update it in the 'posts' table where the total number of likes can be seen.
        const [rows] = await pool.query(`update posts set likes_num=? where post_id=?`,[count,pID]);
        return rows;
    }

    static async addNewComment(pID, content){
        //Check if post allows comments.
        const [allow] =  await pool.query('select comments_allow from posts where post_id=?',[pID]);
        if(!allow || allow.length==0)
            return -2;
        else if(allow[0].comments_allow == false)
            return -3;

        //Get the 'following' list of current user as array i.e. "followedIds".
        const [result1] = await pool.query(`select followed_id from follows where follower_id=?`,[currentUser]);
        const followedIds = result1.map(row => row.followed_id);
        followedIds.push(currentUser);
        const [result]=await pool.query(`select user_id from posts where post_id=?`,[pID]);

        //If result is empty that means no post exists with that post_id.
        if(!result || result.length===0){
            return -2;
        }

        //If user of the post is not in the following of the current user then we cannot proceed further as you cannot comment on the post of someone you do no follow.
        if(!followedIds.includes(result[0].user_id)){
            return -1;
        }

        const cmtID = uuidv4();
        //Insert the new comment into the database
        await pool.query(`insert into comments(comment_id, user_id, post_id, content) values(?,?,?,?)`,[cmtID, currentUser, pID, content]);
        //To check whether the comment has been successfully added to the database.
        const [rows] = await pool.query(`select * from comments where comment_id=?`,[cmtID]);
        return rows;
    }
    static async editOldComment(pID, cID, content){
        //Check whether the comment with that ID even exists.
        const [cmt] = await pool.query(`select * from comments where comment_id=?`,[cID]);
        if(!cmt || cmt.length===0)
            return -3;

        const [result]=await pool.query(`select user_id from comments where post_id=?`,[pID]);

        //If result is empty that means no post exists with that post_id.
        if(!result || result.length===0){
            return -2;
        }

        //Check if current user is same as owner
        if(result[0].user_id != currentUser)
            return -1;

        //Check whether the comment lies with the pID post or not.
        const [temp] = await pool.query(`select * from posts where post_id=?`,[pID]);
        if(!temp || temp.length===0)
            return -4;

        //Update the content of comment in the database.
        await pool.query(`update comments set content=? where comment_id=?`,[content,cID]);
        const [rows] = await pool.query(`select * from comments where comment_id=?`,[cID]);
        return rows;
    }
    static async deleteComment(pID, cID){
        //Check whether the comment with that ID even exists.
        const [cmt] = await pool.query(`select * from comments where comment_id=?`,[cID]);
        if(!cmt || cmt.length===0)
            return -3;

        const [result]=await pool.query(`select user_id from comments where post_id=?`,[pID]);

        //If result is empty that means no post exists with that post_id.
        if(!result || result.length===0){
            return -2;
        }

        //Check if current user is same as owner
        if(result[0].user_id != currentUser)
            return -1;

        //Check whether the comment lies with the pID post or not.
        const [temp] = await pool.query(`select * from posts where post_id=?`,[pID]);
        if(!temp || temp.length===0)
            return -4;

        await pool.query(`delete from comments where user_id=? and post_id=? and comment_id=?`,[currentUser,pID,cID]);
        const [rows] = await pool.query(`select * from comments where user_id=? and post_id=? and comment_id=?`,[currentUser,pID,cID]);
        return rows;
    }
}