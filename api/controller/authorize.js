const { AuthToken } = require("../../models/authtoken");
const jwt = require("jsonwebtoken");
require("dotenv/config");
const secret = process.env.SECRET;

module.exports = {
  logout: async (req, res) => {
    const token= req.headers.authorization
    // console.log("tokennnnnn", token)
    // const decode2 = jwt.verify(JSON.parse(token), secret);
    // console.log("decode2", decode2)
    jwt.verify(JSON.parse(token), secret,async function (err, decoded) {
      if (err) {
        return res.
        status(403).json({success: false, message: err.message});
      } else {
          const userId= decoded.userId
          if(userId){
            try{
              //const deleteAck=  await AuthToken.deleteMany({userId});
              //if(deleteAck  && deleteAck.acknowledged){
                return res
                .status(200)
                .send({ success: true, message: "Logout Successfully."});
              // }else{
              //   return res
              // .status(200)
              // .send({ success: false, message: "Session Expired."});
              // }
            }catch(err) {
              console.log(err);
              return res.status(400).json({
                success: false,
                message: "Session Expired.",
              });
            }
          }else{
            return res
            .status(400)
            .send({ success: false, message: "Session Expired."});
          }
        }
    })
  }
}
