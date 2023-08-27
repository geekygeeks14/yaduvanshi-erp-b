const { userModel } = require("../models/user");
const { AuthToken } = require("../models/authtoken");
const jwt = require("jsonwebtoken");
require("dotenv/config");
const secret = process.env.SECRET;

exports.isAunthaticatedAdmin = async (req, res, next) => {
  try {
    //console.log('yhaaaa')
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({
        message: "Header token not found.",
      });
    }
    console.log("token",token)
    const tokenFound = await AuthToken.findOne({ token: JSON.parse(token) });
    //console.log('tokenFound',tokenFound)
    const decode = jwt.verify(JSON.parse(token), secret);
   
    if(tokenFound){
      if (decode.isAdmin) {
        const userData = await userModel.findOne({ _id: decode.userId });
        if (userData) {
          req.user = userData;
          req.setCompanyId = userData.userInfo.companyId;
          //console.log('passsss111111111', userData.userInfo.companyId)
          //console.log('passsss222222222', req.setCompanyId)
          next();
        } else {
          return res.status(401).json({
            message: "Not Authorized",
          });
        }
      } else {
        return res.status(401).json({
          message: "Not Authorized",
        });
      }
    }else{
        //await AuthToken.deleteMany({ userId: decode.userId })
        return res.status(401).json({
          message: "LOGOUT",
        });
    }
  } catch (error) {
    console.log("errrror", error)
    return res.status(401).json({
        message: "TOKEN EXPIRED",
      });
  }
};

// async function isAunthaticatedUSer(req, res, next) {
//     console.log('inside authentication')
//     console.log('data', req.headers.authorization)
//     console.log(req.headers.AuthToken);
//     try {
//         console.log('yhaaaa')
//         const token = req.headers.authorization;
//         if (!token) {
//             return res.status(401).json({
//                 message: 'Please log-In first'
//             })
//         }

//         const decode = jwt.verify(token, process.env.secret);
//         console.log('dsds', decode)
//         if (decode)
//             req.user = await User.findOne({ _id: decode.userId });

//         next()

//     } catch (error) {

//         return res.status(500).json({
//             message: error.message
//         })
//     }

// }
