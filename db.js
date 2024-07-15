import { createPool } from 'mysql2';

const pool = createPool({
    host:"localhost",
    user:"root",
    password:"sql4data@Dhanta4Saatvik",
    database: "socialmediadatabase",
    connectionLimit: 10,
})

pool.query(`select * from users`,1001,(err,result,fields) => {
    if(err){
        return console.log(err);
    }
    return console.log(result);
})