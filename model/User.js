import { createPool } from "mysql2/promise";
import { v4 as uuidv4 } from 'uuid';

const pool = createPool({
    host:"localhost",
    user:"root",
    password:"sql4data@Dhanta4Saatvik",
    database: "socialmediadatabase",
    connectionLimit: 10,
});

export default class User {
  constructor({username, email, password,fullName,id=uuidv4()}) {
    this.id=id;
    this.username = username;
    this.email = email;
    this.password = password;
    this.fullName = fullName;
  }

  static async find() {
    const [rows] = await pool.query('SELECT * FROM users');
    return rows;
  }
  static async findOne(email) {
    const [rows] = await pool.query(`SELECT * FROM users where email="${email}"`);
    // console.log(rows);
    return rows;
  }
  static async add(id,username,fullName,email,password){
    await pool.query(`INSERT INTO users VALUES(?, ?, ?, ?, ?)`,[id,username,email,password,fullName]);
  }
  static async followUserById(followed_id, follower_id){
    const [result]=await pool.query(`select * from follows where follower_id=? and followed_id=?`,[follower_id,followed_id]);
    if(result.length!=0){
      return -1;
    }
    await pool.query(`insert into follows(follower_id, followed_id) values (?,?)`,[follower_id,followed_id]);
    const [rows]=await pool.query(`select * from follows where follower_id=? and followed_id=?`,[follower_id,followed_id]);
    return rows;
  }
}
