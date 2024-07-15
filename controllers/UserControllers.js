import User from "../model/User";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export let currentUser;
const JWT_SECRET = 'Toddle@Task';

export const signup = async (req,res,next)=> {
    const {username,fullName,email,password}=req.body;

    let existingUserID;
    try{
        existingUserID = await User.findOne(email);
    }catch(err){
        return console.log(err);
    }
    if(existingUserID.length != 0){
        return res.status(400).json({message: "User Already Exists! Login Instead",Name:existingUserID.full_name});
    }

    console.log(username);
    const hashPass = bcrypt.hashSync(password);
    const user = new User({
        username,
        fullName,
        email,
        password: hashPass
    });
    try{
        await User.add(user.id,user.username,user.fullName,user.email,user.password);
    }catch(err){
        return console.log(err);
    }
    return res.status(201).json({user});
}

export const login = async (req,res,next)=>{
    const {email,password}=req.body;
    let existingUser=[];
    try{
        existingUser = await User.findOne(email);
    }catch(err){
        return console.log(err);
    }
    if(!existingUser || existingUser.length === 0){
        return res.status(404).json({message: "User Not Found. Try Signing Up"});
    }
    const user=existingUser[0];
    
    const isPasswordCorrect = bcrypt.compareSync(password,user.password);
    if(!isPasswordCorrect){
        return res.status(400).json({message:"Incorrect Password"});
    }
    currentUser=user.id;

    let token;
    try{
        token = jwt.sign({ userId: currentUser }, JWT_SECRET);
    }catch(err){
        res.status(500).json({ message: 'Internal server error' });
    }
    

    return res.status(200).json({message:"Login Successful", token:token});
}

export const followUser=async(req,res,next)=>{
    const followed_id = req.params.id;
    const follower_id=currentUser;
    if(followed_id==follower_id){
        return res.status(400).json({message:"You cannot follow yourself."});
    }
    let follow;
    try{
        follow = await User.followUserById(followed_id, follower_id);
    }catch(err){
        return console.log(err);
    }
    if(follow==-1){
        return res.status(400).json({message:"You are already following this user."})
    }
    if(!follow || follow.length===0){
        return res.status(500).json({message:"Unable to follow user.."});
    }
    return res.status(200).json({message:"You are now following this user."})
}