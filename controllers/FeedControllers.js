import Feed from "../model/Feed";
import { currentUser } from "./UserControllers";

//Controller for feed, where we will show all posts from the current user as well as the people they follow.
export const getAllPosts = async(req,res,next)=>{
    let posts;
    try{
        //Function call to retreive data from database.
        posts=await Feed.find();
    }catch(err){
        return console.log(err);
    }
    //If posts is empty that means no posts exist for the user.
    if(!posts || posts.length===0){
        return res.status(404).json({message: "No posts found."})
    }
    return res.status(200).json({posts});
}

//Controller for creating a new post
export const createPost = async (req,res,next)=>{
    //Body elements being assigned
    const{mediaUrl, content, commentAllow} = req.body;
    const newPost = new Feed({
        mediaUrl,
        content,
        commentAllow
    })
    let post;
    try{
        //Function call to retreive data from database.
        post = await Feed.CreateNewPost(newPost.mediaUrl, newPost.content, newPost.commentAllow);
    }catch(err){
        return console.log(err);
    }
    //If post is empty, that means new post failed to be created. Post was to contain the new post's data.
    if(!post || post.length===0)
        return res.status(500).json({message:"Unable to create new post.."})
    return res.status(200).json({post});
}

//Controller for updating or making changed to a pre-existing post.
export const updatePost = async(req,res,next)=>{
    //Body elements being assigned
    const {content, mediaUrl} = req.body;
    const pID = req.params.id;

    let post;
    try{
        //Function call to retreive data from database.
        post = await Feed.findByIdAndUpdate(
            pID,
            content,
            mediaUrl
        );
    }catch(err){
        return console.log(err);
    }
    //Check for special return values for specific responses.
    if(post){
        if(post==-2)
            return res.status(400).json({message:"Post does not exist."});
        if(post==-1)
            return res.status(400).json({message:"You cannot edit this post as you are not the owner."});
    }
    //If post is empty, then no post exists for the 'post_id' and corespondng to the current user.
    if(!post || post.length===0){
        return res.status(500).json({message:"Post not found."});
    }
    let con=post[0].content;
    let med=post[0].media_url;
    return res.status(201).json({message:"Post updated..", content:con, mediaUrl:med});
    
}

//Controller for viewing a specific post instead of the entire feed.
export const getPost = async(req,res,next)=>{
    //ID from URL being extracted and stored as constant for further use
    const pID=req.params.id;
    let post;
    try{
        //Function call to retreive data from database.
        post = await Feed.findById(pID);
    }catch(err){
        return console.log(err);
    }
    //Check for special return values for specific responses.
    if(post){
        if(post==-2)
            return res.status(400).json({message:"Post does not exist."});
        if(post==-1)
            return res.status(400).json({message:"You cannot view this post as you are not the owner and neither a follower of the owner."});
    }
    //If post is empty, then no post exists for the 'post_id' and corespondng to the current user.
    if(!post || post.length===0){
        return res.status(404).json({message:"Post not Found.."});
    }
    return res.status(200).json({post});
}

//Controller for deleting a post.
export const removePost = async(req,res,next)=>{
    //ID from URL being extracted and stored as constant for further use
    const pID=req.params.id;
    let post;
    try{
        //Function call to retreive data from database.
        post = await Feed.findByIdAndRemove(pID);
    }catch(err){
        return console.log(err);
    }
    //Check for special return values for specific responses.
    if(post){
        if(post==-1){
            return res.status(404).json({message:"Unable to delete, because either the post does not exist or you are not the owner."})
        }
    }
    //If post is empty, then the post has been successfully deleted as their is not data for that post left in the database. Hence empty.
    if(!post || post.length===0){
        return res.status(200).json({message:"Post successfuly deleted.."});
    }
    return res.status(500).json({message:"Unable to delete."});
    
}

//Controller for liking a post.
export const likePost=async(req,res,next)=>{
    //ID from URL being extracted and stored as constant for further use
    const pID=req.params.id;
    let post;
    try{
        //Function call to retreive data from database.
        post = await Feed.likingPost(pID);
    }catch(err){
        return console.log(err);
    }
    //Check for special return values for specific responses.
    if(post){
        if(post==-3)
            return res.status(400).json({message:"You can like this post only once."});
        if(post==-2)
            return res.status(400).json({message:"Post does not exist."});
        if(post==-1)
            return res.status(400).json({message:"Unable to like, because you do not follow the owner of this post."});
    }
    //If post is empty, then no post exists for the 'post_id' and corespondng to the current user.
    if(!post || post.length===0){
        return res.status(400).json({message:"Post not Found.."});
    }
    try{
        //Function call to update the 'posts' table for the value of number of likes that need to be increased as the user has liked that post.
        await Feed.updateAddLikes(pID);
    }catch(err){
        return console.log(err);
    }
    return res.status(200).json({message:"Post liked ;)"});
}

//Controller for removing the like from a post.
export const unlikePost=async(req,res,next)=>{
    //ID from URL being extracted and stored as constant for further use
    const pID=req.params.id;
    let post;
    try{
        //Function call to retreive data from database.
        post = await Feed.unlikePost(pID);
    }catch(err){
        return console.log(err);
    }
    //Check for special return values for specific responses.
    if(post){
        if(post==-3)
            return res.status(400).json({message:"Cannot unlike as post does not have a like from current user"});
        if(post==-2)
            return res.status(400).json({message:"Post does not exist."});
        if(post==-1)
            return res.status(400).json({message:"Unable to unlike, because you do not follow the owner of this post."});
    }
    //If post is empty, that means no like exists for that post from the current user. Hence successfully unliked.
    if(!post || post.length===0){
        try{
            //Function call to update the 'posts' table for the value of number of likes that need to be decreased as the user has unliked that post.
            await Feed.updateSubtractLikes(pID);
        }catch(err){
            return console.log(err);
        }
        return res.status(200).json({message:"Unliked from post."})
    }
    return res.status(500).json({message:"Unable to unlike."});
}

//Controller to add new comments to posts
export const addComment=async(req,res,next)=>{
    //ID from URL being extracted and stored as constant for further use
    const pID=req.params.id;
    //Content for comment received from body
    const {content}=req.body;
    let post;
    try{
        //Function call to retreive data from database.
        post = await Feed.addNewComment(pID, content);
    }catch(err){
        return console.log(err);
    }
    //Check for special return values for specific responses.
    if(post){
        if(post==-3)
            return res.status(400).json({message:"Cannot comment. Post does not allow comments."});
        if(post==-2)
            return res.status(400).json({message:"Post does not exist."});
        if(post==-1)
            return res.status(400).json({message:"Unable to comment, because you do not follow the owner of this post."});
    }
    //If post is empty, that means new comment could not be created for that post.
    if(!post || post.length===0){
        return res.status(500).json({message:"Unable to comment."});
    }
    return res.status(200).json({message:"Comment has been added on the post."});
}

export const editComment=async(req,res,next)=>{
    //ID from URL being extracted and stored as constant for further use
    const pID=req.params.id;
    const cID=req.params.cid;
    //Content for comment received from body
    const {content}=req.body;
    let post;
    try{
        //Function call to retreive data from database.
        post = await Feed.editOldComment(pID, cID, content);
    }catch(err){
        return console.log(err);
    }
    //Check for special return values for specific responses.
    if(post){
        if(post==-4)
            return res.status(400).json({message:"This comment does not exist on this post."});
        if(post==-3)
            return res.status(400).json({message:"Comment does not exist."});
        if(post==-2)
            return res.status(400).json({message:"Post does not exist with that id."});
        if(post==-1)
            return res.status(400).json({message:"Unable to edit comment, because you are not the owner."});
    }
    //If post is empty, that means new comment could not be created for that post.
    if(!post || post.length===0){
        return res.status(500).json({message:"Unable to edit comment."});
    }
    return res.status(200).json({message:"Comment has been edited.",content:post[0].content});
}

export const removeComment=async(req,res,next)=>{
    //ID from URL being extracted and stored as constant for further use
    const pID=req.params.id;
    const cID=req.params.cid;
    let post;
    try{
        //Function call to retreive data from database.
        post = await Feed.deleteComment(pID, cID);
    }catch(err){
        return console.log(err);
    }
    //Check for special return values for specific responses.
    if(post){
        if(post==-4)
            return res.status(400).json({message:"This comment does not exist on this post."});
        if(post==-3)
            return res.status(400).json({message:"Comment does not exist."});
        if(post==-2)
            return res.status(400).json({message:"Post does not exist with that id."});
        if(post==-1)
            return res.status(400).json({message:"Unable to delete comment, because you are not the owner."});
    }
    //If post is empty, that means comment deleted.
    if(!post || post.length===0){
        return res.status(200).json({message:"Comment has been deleted successfully."});
    }
    return res.status(500).json({message:"Unable to delete comment."});
    
}