const { userModel } = require("../../models/user");
const {roleModel} = require("../../models/role")
const { ObjectId } = require("mongodb");
const { purchaseModel } = require("../../models/purchase");
const { sellModel } = require("../../models/sell");
const { productNameModel } = require("../../models/producName");
const { productCodeModel } = require("../../models/productCode");
const { fluctualWeightModel } = require("../../models/fluctualWeight");
const {
  newUserIdGen,
  randomPassword,
  passwordEncryptAES,
  passwordDecryptAES,
  newCompanyIdGen,
  decryptAES,
} = require("../../util/helper");
const { workDetailModel } = require("../../models/workDeatail");
const { recieverModel } = require("../../models/reciever");
const { response } = require("express");

module.exports = {

 
getDashboardData: async (req, res) => {
  try {
    let companyId = req.setCompanyId
    let companyParam={companyId: companyId}
    const roleName = req.user.userInfo.roleName
    if(roleName&& roleName==='TOPADMIN'){
      companyParam= {}
    }
    let date = new Date(req.query.todayDate)
     let date_end = new Date(req.query.todayDate) 
     let startDate = new Date(date.setDate(date.getDate()-1)); 
     let endDate= new Date(date_end.setDate(date_end.getDate()))
      startDate.setUTCHours(18); startDate.setUTCMinutes(30); 
      startDate.setSeconds(0); startDate.setMilliseconds(0); 
      endDate.setUTCHours(18); endDate.setUTCMinutes(30); 
      endDate.setSeconds(0); endDate.setMilliseconds(0); 
      params = { 
        'created': 
          { "$gte": startDate, 
            "$lte": endDate
          } 
       };
      //console.log(JSON.stringify(params)) 
      const todaySellsData = await sellModel.find({$and:[params, companyParam]})
      let todaySell=0
      let todayPaid=0
      if(todaySellsData && todaySellsData.length>0){
        todaySell =todaySellsData.reduce((acc, curr)=> acc + curr.totalAmount, 0)
        todayPaid =todaySellsData.reduce((acc, curr)=> acc + curr.paidAmount, 0)
      }
      const dashboardData={
        todaySell : todaySell.toString(),
        todayPaid : todayPaid.toString(),
        todayDue  : (todaySell-todayPaid).toString()
      }
     
    return res.status(200).json({
      success: true,
      dashboardData
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      success: false,
      message: "Error while getting sell data.",
      error: err.message,
    });
  }
},
  getAllSell: async (req, res) => {
    //one time query
    // const adminData = await userModel.findOne({'userInfo.roleName':'ADMIN'})
    // const allDataToUpdate = await sellModel.find({ companyId: { $exists: false }});
    // const adminCompanyId =  req.setCompanyId
    // if(allDataToUpdate && allDataToUpdate.length>0){
    //   for(let i=0; i<allDataToUpdate.length; i++){
    //       const currentData= allDataToUpdate[i]
    //       await sellModel.findOneAndUpdate({_id: currentData._id},{ companyId: adminCompanyId},{insertedBy: adminData._id.toString()});
    //     } 
    // }
    //
    let cndPram={}
    let companyId = req.setCompanyId
    let companyParam={companyId: companyId}
    const roleName = req.user.userInfo.roleName
    if(roleName&& (roleName==='TOPADMIN' || roleName==='SUPER_ADMIN')){
      companyParam= {}
    }

    if(req.query.companyId && req.query.companyId!=='All'){
      companyParam={companyId: req.query.companyId}
    }
    // if(companyId && roleName&& roleName==='ADMIN'|| roleName==='INSTANCE ADMIN'){
    //   companyParam= {companyId:req.query.companyId}
    // }
    if(req.query.productNameId){
      cndPram={
        ...cndPram,
        'sellInfo.productNameId':req.query.productNameId
      }
    }
    if(req.query.productCodeId){
      cndPram={
        ...cndPram,
        'sellInfo.productCodeId':req.query.productCodeId
      }
    }
    if(req.query.length){
      cndPram={
        ...cndPram,
        'sellInfo.length':req.query.length
      }
    }
    if(req.query.height){
      cndPram={
        ...cndPram,
        'sellInfo.height':req.query.height
      }
    }
    if(req.query.breadth){
      cndPram={
        ...cndPram,
        'sellInfo.breadth':req.query.breadth
      }
    }
    try {
      const sellData = await sellModel.find({$and: [{ deleted: false },companyParam, cndPram]});
      return res.status(200).json({
        success: true,
        sellData,
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while getting sell data.",
        error: err.message,
      });
    }
  },
  getAllPurchase: async (req, res) => {
    try {

      //one time query
      // const adminData = await userModel.findOne({'userInfo.roleName':'ADMIN'})
      // const allDataToUpdate = await purchaseModel.find({ companyId: { $exists: false }});
      // const adminCompanyId =  req.setCompanyId
      // if(allDataToUpdate && allDataToUpdate.length>0){
      //   for(let i=0; i<allDataToUpdate.length; i++){
      //     const currentData = allDataToUpdate[i]
      //     await purchaseModel.findOneAndUpdate({_id: currentData._id},{ companyId: adminCompanyId},{insertedBy: adminData._id.toString()});
      //   }
      // }
      //
      const companyId =  req.setCompanyId
      console.log("companyIddddd", companyId)
      let companyParam = {companyId: companyId}
      const roleName = req.user.userInfo.roleName
      if(roleName && roleName === 'TOPADMIN'){
        companyParam = {}
      }
      const purchaseData = await purchaseModel.find({$and: [{ deleted: false },companyParam]});
      return res.status(200).json({
        success: true,
        purchaseData,
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while getting sell data.",
        error: err.message,
      });
    }
  },
  createSell: async(req, res, next)=>{
    try{
      let payInfo=[]
       if(req.body.payInfo && req.body.payInfo.length>0){
        payInfo = req.body.payInfo.map(elem => (
          {
           ...elem,
           payDate: new Date()
          } 
        ))
       }
      const newSellData = new sellModel({
        ...req.body,
        payInfo: payInfo
      });
     const newSellDataCreated = await newSellData.save();
      if(newSellDataCreated){
        return res.status(200).json({
          success: true,
          message:'Success'
        });
      }else{
        return res.status(200).json({
          success: false,
          message:'Error, Please try again!'
        });
      }
     
    }catch(err){
      console.log("errr",err)
      return res.status(400).json({
        success: false,
        message:'Error while submiting sell data',
        error: err.message,
      });
    }
  
  },
  updateSell: async(req, res, next)=>{
    try{
      if(req.body.actionPassword){
        const getUserActionPsw= decryptAES(req.body.actionPassword, req.user.userInfo.password)
        if(passwordDecryptAES(req.user.userInfo.actionPassword)!== passwordDecryptAES(getUserActionPsw)){
         return res.status(200).json({
           success: false,
           message:'Action password incorrect',
           actionPassword: true // dont remove/change this Frontend dependency
         });
        }
     }
      let payInfo=[]
      const sellData=  await sellModel.findOne({_id: req.params.id});
      const oldPayInfo= sellData && sellData.payInfo && sellData.payInfo.length>0? sellData.payInfo: []
   
      if(req.body.payInfo && req.body.payInfo.length>0){
        payInfo = req.body.payInfo.map(elem => {
            let newData={}
            if(elem._id && oldPayInfo.length>0 && (parseFloat(oldPayInfo.find(data=> data._id.toString() ===elem._id.toString()).amount) !== parseFloat(elem.amount))){
              newData={...elem, payModifiedDate: new Date() }
            }else{
              newData={ ...elem, payDate: new Date()}
            }
            return newData
          }
        )
      }       
      const updateData = {
        ...req.body,
        payInfo: payInfo,
        modified: new Date()
      };
      const updateSellData=  await sellModel.findOneAndUpdate({_id: req.params.id}, updateData);
      if(updateSellData){
        return res.status(200).json({
          success: true,
          message:'Update Success'
        });
      }else{
        return res.status(200).json({
          success: false,
          message:'Update sell error, Please try again!'
        });
      }
     
    }catch(err){
      console.log("errr",err)
      return res.status(400).json({
        success: false,
        message:'Error while updating sell data.',
        error: err.message,
      });
    }
  },

  createPurchase: async(req, res, next)=>{
    try{
      if(req.body.workDetail && req.body.workDetail.unLoadingWorker && req.body.workDetail.unLoadingWorker.length>0){
          for (const it of req.body.workDetail.unLoadingWorker) {
              let workFound = await workDetailModel.findOne({$and:[{userId: it.userId},{dateOfWork: req.body.workDetail.dateOfWork}]})
              const newUnLoadingWork= [{unLoadingNote:req.body.workDetail.unLoadingNote, unLoadingStartTime:req.body.workDetail.unLoadingStartTime, unLoadingEndTime: req.body.workDetail.unLoadingEndTime,unLoadingRowTime: req.body.workDetail.unLoadingRowTime, truck:true}]
              if(workFound && workFound.unLoadingWorkList){
               
                const truckUnLoadingWork= workFound.unLoadingWorkList.find(data=> data.truck)
                if(truckUnLoadingWork){
                  let oldUnLoadingWork= workFound.unLoadingWorkList.filter(data=> !data.truck)
                  workFound.unLoadingWorkList= [...oldUnLoadingWork, ...newUnLoadingWork]
                
                  let totalMilliSec=0
                  const allList = [...workFound.loadingWorkList,...workFound.unLoadingWorkList,...workFound.productionWorkList,...workFound.otherWorkList]
                  allList.forEach(data=>{
                  if(data.loadingRowTime || data.unLoadingRowTime || data.productionRowTime || data.otherRowTime){
                        const time=   data.loadingRowTime>0?data.loadingRowTime: data.unLoadingRowTime>0? data.unLoadingRowTime: data.productionRowTime>0? data.productionRowTime: data.otherRowTime>0? data.otherRowTime:0
                        totalMilliSec+= parseInt(time)
                    }
                  })
                  workFound.totalMilliSec = totalMilliSec
                
                }else{
                  let oldUnLoadingWork= workFound.unLoadingWorkList
                  workFound.unLoadingWorkList= [...oldUnLoadingWork,...newUnLoadingWork]
                  workFound.totalMilliSec =  parseInt(workFound.totalMilliSec) + parseInt(req.body.workDetail.unLoadingRowTime)
                }
                await workDetailModel.findOneAndUpdate({_id: workFound._id},workFound)
              }else{
                const newWorkDetail= new workDetailModel({
                  userId: it.userId,
                  loadingWorkList: [],
                  unLoadingWorkList: newUnLoadingWork,
                  productionWorkList: [],
                  otherWorkList : [],
                  parentUserId: req.body.workDetail.parentUserId,
                  companyId: req.body.workDetail.companyId?req.body.workDetail.companyId:'423523523',
                  totalMilliSec: req.body.workDetail.totalMilliSec?req.body.workDetail.totalMilliSec:0,
                  dateOfWork : req.body.workDetail.dateOfWork
                });
                const newWorkDetailCreated = await newWorkDetail.save();
              }
          }
      }
     const newPurchaseData = new purchaseModel({
       ...req.body,
     });
   
     const newPurchaseDataCreated = await newPurchaseData.save();
      if(newPurchaseDataCreated){
        return res.status(200).json({
          success: true,
          message:'Success'
        });
      }else{
        return res.status(200).json({
          success: false,
          message:'Error, Please try again!'
        });
      }
     
    }catch(err){
      return res.status(400).json({
        success: false,
        message:'Error while submiting purchase data',
        error: err.message,
      });
    }
  },

  deleteSellData: async (req, res) => {
    try {
      if(req.query.actionPassword){
        const getUserActionPsw= decryptAES(req.query.actionPassword, req.user.userInfo.password)
        if(passwordDecryptAES(req.user.userInfo.actionPassword)!== passwordDecryptAES(getUserActionPsw)){
         return res.status(200).json({
           success: false,
           message:'Action password incorrect',
           actionPassword: true // dont remove/change this Frontend dependency
         });
        }
     }
      await sellModel.findOneAndUpdate({_id: req.params.id},{deleted:true});
      return res.status(200).json({
        success: true,
        message:`Deleted succesfully.`,
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while deleting sell detail.",
        error: err.message,
      });
    }
  },
  deletePurchaseData: async (req, res) => {
    try {
      await purchaseModel.findOneAndUpdate({_id: req.params.id},{deleted:true});
      return res.status(200).json({
        success: true,
        message:`Deleted succesfully.`,
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while deleting purchase detail.",
        error: err.message,
      });
    }
  },

  createProductName: async(req, res, next)=>{
    try{
      let companyId = req.setCompanyId
      let companyParam={companyId: companyId}
      const roleName = req.user.userInfo.roleName
      if(roleName&& roleName==='TOPADMIN'){
        companyParam= {}
      }
      const findProductName = await productNameModel.findOne({$and:[{ productName: req.body.productName.trim().toLowerCase()},companyParam]});
      if(findProductName){
        return res.status(200).json({
          success: false,
          message:'Already product name added'
        });
      }else{
        const newProductNameData= new productNameModel({
          productName :req.body.productName,
          companyId : req.body.companyId
        });
        const newProductNameCreated = await newProductNameData.save();
        if(newProductNameCreated){
          return res.status(200).json({
            success: true,
            message:'Success'
          });
        }else{
          return res.status(200).json({
            success: false,
            message:'Error, Please try again!'
          });
        }
      }
    }catch(err){
      return res.status(400).json({
        success: false,
        message:'Error while submiting product name',
        error: err.message,
      });
    }
  },

  createProductCode: async(req, res, next)=>{
    try{
      let companyId = req.setCompanyId
      let companyParam={companyId: companyId}
      const roleName = req.user.userInfo.roleName
      if(roleName&& roleName==='TOPADMIN'){
        companyParam= {}
      }
      const findProductCode = await productCodeModel.findOne({$and:[{productCode: req.body.productCode}, companyParam]});
      if(findProductCode){
        return res.status(200).json({
          success: false,
          message:'Already product code added'
        });
      }else{
        const newProductCodeData= new productCodeModel({
          productCode :req.body.productCode,
          companyId : req.body.companyId
        });
        const newProductCodeCreated = await newProductCodeData.save();
        if(newProductCodeCreated){
          return res.status(200).json({
            success: true,
            message:'Success'
          });
        }else{
          return res.status(200).json({
            success: false,
            message:'Error, Please try again!'
          });
        }
      }
    }catch(err){
      return res.status(400).json({
        success: false,
        message:'Error while submiting product Code',
        error: err.message,
      });
    }
  },
  createFluctualWeight: async(req, res, next)=>{
    try{

      let companyId = req.setCompanyId
      let companyParam={companyId: companyId}
      const roleName = req.user.userInfo.roleName
      if(roleName&& roleName==='TOPADMIN'){
        companyParam= {}
      }
      const findfluctualWeight = await fluctualWeightModel.find(companyParam);
      if(findfluctualWeight && findfluctualWeight.length>0){
        return res.status(200).json({
          success: false,
          message:'Already added'
        });
      }else{
        const newFluctualateWeight= new fluctualWeightModel({
          fluctualateWeightValue :req.body.fluctualateWeightValue,
        });
        const newFluctualateWeightCreated = await newFluctualateWeight.save();
        if(newFluctualateWeightCreated){
          return res.status(200).json({
            success: true,
            message:'Success'
          });
        }else{
          return res.status(200).json({
            success: false,
            message:'Error, Please try again!'
          });
        }
      }
    }catch(err){
      return res.status(400).json({
        success: false,
        message:'Error while adding value',
        error: err.message,
      });
    }
  },
  updateFluctualWeight: async(req, res, next)=>{
    try{
      const updatefluctualWeight = await fluctualWeightModel.findOneAndUpdate({_id: req.params.id},{ fluctualateWeightValue :req.body.fluctualateWeightValue, modified: new Date()});
  
      if(updatefluctualWeight){
        return res.status(200).json({
          success: true,
          message:'Update Success'
        });
      }else{
        return res.status(200).json({
          success: false,
          message:'Update failed, Please try again!'
        });
      }
      
    }catch(err){
      return res.status(400).json({
        success: false,
        message:'Error while updating value',
        error: err.message,
      });
    }
  },
  getFluctualWeight: async(req, res, next)=>{
    try{
        // //one time query
        // const allDataToUpdate = await fluctualWeightModel.find({ companyId: { $exists: false }});
        // const adminCompanyId =  req.setCompanyId
        // if(allDataToUpdate && allDataToUpdate.length>0){
        //   for(let i=0; i<allDataToUpdate.length; i++){
        //       const currentData = allDataToUpdate[i]
        //       await fluctualWeightModel.findOneAndUpdate({_id: currentData._id},{ companyId: adminCompanyId});
        //   }
        // }
        // //
      let companyId = req.setCompanyId
      let companyParam={companyId: companyId}
      const roleName = req.user.userInfo.roleName
      if(roleName&& roleName==='TOPADMIN'){
        companyParam= {}
      }
      const fluctualWeightData = await fluctualWeightModel.find({$and:[{deleted:false},companyParam]});
  
      if(fluctualWeightData && fluctualWeightData.length>0){
        return res.status(200).json({
          success: true,
          message:'Get successfully',
          data : fluctualWeightData
        });
      }else{
        return res.status(200).json({
          success: false,
          message:'No values found, Please try again!'
        });
      }
      
    }catch(err){
      return res.status(400).json({
        success: false,
        message:'Error while getting value',
        error: err.message,
      });
    }
  },
  getAllProductName: async (req, res) => {
    try {
        //one time query
        // const allDataToUpdate = await productNameModel.find({ companyId: { $exists: false }});
        // const adminCompanyId =  req.setCompanyId
        // if(allDataToUpdate && allDataToUpdate.length>0){
        //   for(let i=0; i<allDataToUpdate.length; i++){
        //       const currentData = allDataToUpdate[i]
        //       await productNameModel.findOneAndUpdate({_id: currentData._id},{ companyId: adminCompanyId});
        //   }
        // }
        //
        let companyId = req.setCompanyId
        let companyParam={companyId: companyId}
        const roleName = req.user.userInfo.roleName
        if(roleName&& roleName==='TOPADMIN'){
          companyParam= {}
        }
      const productNameData = await productNameModel.find({$and: [companyParam]});
      const allProductNameData = await productNameModel.find(companyParam);
      return res.status(200).json({
        success: true,
        productNameData,
        allProductNameData
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while getting product name data.",
        error: err.message,
      });
    }
  },
  getAllProductCode: async (req, res) => {
    try {
        //one time query
        // const allDataToUpdate = await productCodeModel.find({ companyId: { $exists: false }});
        // const adminCompanyId =  req.setCompanyId
        // if(allDataToUpdate && allDataToUpdate.length>0){
        //   for(let i=0; i<allDataToUpdate.length; i++){
        //       const currentData = allDataToUpdate[i]
        //       await productCodeModel.findOneAndUpdate({_id: currentData._id},{ companyId: adminCompanyId});
        //   }
        // }
        //
        let companyId = req.setCompanyId
        let companyParam={companyId: companyId}
        const roleName = req.user.userInfo.roleName
        if(roleName&& roleName==='TOPADMIN'){
          companyParam= {}
        }
      const productCodeData = await productCodeModel.find({$and: [{ deleted: false },companyParam]});
      const allProductCodeData = await productCodeModel.find(companyParam);
      return res.status(200).json({
        success: true,
        productCodeData,
        allProductCodeData
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while getting product Code data.",
        error: err.message,
      });
    }
  },
  updateProductNameById: async (req, res) => {
    try {
      const updateProductName = await productNameModel.findOneAndUpdate({_id:req.body.id},{productName:req.body.productName});
      if(updateProductName){
        return res.status(200).json({
          success: true,
          message: "Updated successfully",
        });
      }else{
        return res.status(200).json({
          success: false,
          message: "Please try again!",
        });
      }
    
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while updating product Name data.",
        error: err.message,
      });
    }
  },
  updateProductCodeById: async (req, res) => {
    try {
      const updateProductCode = await productCodeModel.findOneAndUpdate({_id:req.body.id},{productCode:req.body.productCode});
      if(updateProductCode){
        return res.status(200).json({
          success: true,
          message: "Updated successfully",
        });
      }else{
        return res.status(200).json({
          success: false,
          message: "Please try again!",
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while updating product Code data.",
        error: err.message,
      });
    }
  },
  deleteProductNameById: async (req, res) => {
    try {
      const deleteProductName = await productNameModel.findOneAndUpdate({_id:req.params.id},{deleted:true});
      if(deleteProductName){
        return res.status(200).json({
          success: true,
          message: "Deleted successfully",
        });
      }else{
        return res.status(200).json({
          success: false,
          message: "Please try again!",
        });
      }
    
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while deleting product Name data.",
        error: err.message,
      });
    }
  },
  deleteProductCodeById: async (req, res) => {
    try {
      const deleteProductCode = await productCodeModel.findOneAndUpdate({_id:req.params.id},{deleted:true});
      if(deleteProductCode){
        return res.status(200).json({
          success: true,
          message: "Deleted successfully",
        });
      }else{
        return res.status(200).json({
          success: false,
          message: "Please try again!",
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while deleting product Code data.",
        error: err.message,
      });
    }
  },
  permanentDelete: async (req, res) => {
    try {
      if(req.body.id && req.body.modelName==='purchase'){
        await purchaseModel.findOneAndDelete({_id: req.body.id});
      }
      if(req.body.id && req.body.modelName==='sell'){
        await sellModel.findOneAndDelete({_id: req.body.id});
      }
      return res.status(200).json({
        success: true,
        message:`Permanent ${req.body.modelName} deleted succesfully.`,
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while permanent deleting.",
        error: err.message,
      });
    }
  },
  addUser: async (req, res) => {
    try {
      const userId = await newUserIdGen();
      //req.body.companyId? req.body.companyId:
      let companyId=  req.body.companyId? req.body.companyId: await newCompanyIdGen()
      let parentUserId= req.body.parentUserId? req.body.parentUserId: undefined
      const getRoleId = await roleModel.findOne({ _id: req.body.roleId});
      let newPassword =  randomPassword().join("").toString();
      if(!getRoleId){
        return res.status(200).json({
          success: false,
          message: 'Role not found.',
        });
      }
      let newUser = new userModel({
        userInfo: {
          ...req.body,
          fullName: `${req.body.firstName} ${req.body.lastName}`,
          roleId: getRoleId._id.toString(),
          roleName: getRoleId.roleName,
          userId: userId,
          companyId: companyId,
          password: passwordEncryptAES(newPassword),
          parentUserId:parentUserId
        },
        isActive: true,
        isApproved: true,
        
      });
      let userData = await newUser.save();

      const responseData = {
        fullName: `${req.body.firstName} ${req.body.lastName}` ,
        phoneNumber: req.body.phoneNumber1,
        companyId: userId,
        password: newPassword,
      };
     
      if (userData) {
        return res.status(200).json({
          success: true,
          message: "Registration successful.",
          data: responseData
        });
      } else {
        return res.status(200).json({
          success: false,
          message: 'Registration faild, Please try again!',
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while registration.",
        error: err.message,
      });
    }
  },


  getAllUsers: async (req, res) => {
    try {
      const searchStr= req.body.searchStr
      //let searchParam={}
      //let classParam={}
      let roleParam={}
      //  if (searchStr && searchStr !== "" && searchStr !== undefined && searchStr !== null){
      //    searchParam={
      //     $or:[
      //       {'userInfo.roleName': new RegExp(searchStr, 'i')},
      //       {'userInfo.fullName': new RegExp(searchStr, 'i')},
      //       {'userInfo.fatherName': new RegExp(searchStr, 'i')},
      //       {'userInfo.motherName': new RegExp(searchStr, 'i')},
      //       {'userInfo.email': new RegExp(searchStr, 'i')},
      //       {'userInfo.phoneNumber1': new RegExp(searchStr, 'i')},
      //       {'userInfo.phoneNumber2': new RegExp(searchStr, 'i')},
      //       {'userInfo.aadharNumber':new RegExp(searchStr, 'i')},
      //       {'userInfo.userId':new RegExp(searchStr, 'i')}
      //     ]
      //   }
      // }
      // if(req.body.selectedClass){
      //     classParam={'userInfo.class':req.body.selectedClass}
      // }

      let companyId = req.setCompanyId
      let companyParam={}
      const roleName = req.user.userInfo.roleName
      let roleRestriction=['TOPADMIN','ADMIN','SUPER_ADMIN']
      if(roleName && roleName==='TOPADMIN'){
        companyParam= {}
      }
      if(roleName && (roleName==='INSTANCE ADMIN' || roleName==='ADMIN')){
        companyParam= {'userInfo.companyId': companyId}
      }
      if(req.query.userType && req.query.userType==='WORKER'){
        roleRestriction.push('INSTANCE ADMIN')
      }
      if(!req.query.userType){
        roleRestriction.push('WORKER')
      }

      const restrictUser={'userInfo.roleName':{$nin:roleRestriction}}
      const users = await userModel.find({
        $and: [ { deleted: false },restrictUser,companyParam]
      });
      return res.status(200).json({
        success: true,
        users,
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "User not found.",
        error: err.message,
      });
    }
  },

  deleteUser: async (req, res) => {
    try {
     await userModel.findOneAndUpdate({_id:req.params.id},{deleted: true, modified:new Date()});
      return res.status(200).json({
        success: true,
        message: "Deleted successfully."
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "user not found.",
        error: err.message,
      });
    }
  },

  updateUserById: async (req, res) => {
    try {
      // if(req.body.roleUpdate){
      //     const newRoleName = req.body.newRoleName
      //     delete req.body.updateRole
      //     delete req.body.newRoleName
      //     const getNewRoleData= await roleModel.findOne({$and:[{roleName:newRoleName},{ roleName:{$nin:['TOPADMIN','ADMIN']}}]})
      //     if(getNewRoleData){
      //       req.body.roleName = getNewRoleData.roleName
      //       req.body.roleId = getNewRoleData._id.toString()
      //     }
      // }
      let user =  await userModel.findOne({_id:req.params.id});
      if(!user){
        return res.status(400).json({
          success: false,
          message: "user not found.",
          error: err.message,
        });
      }

      user.userInfo={
        ...user.userInfo,
        ...req.body
      }
      user.userInfo.fullName = req.body.firstName +" "+req.body.lastName
      user.modified = new Date();

     const updatedUser= await userModel.findOneAndUpdate({_id:req.params.id}, user,{new:true});
      if(updatedUser && req.body.passwordChange){
        await AuthToken.deleteMany({ userId: user.userInfo.userId })
      }
      return res.status(200).json({
        success: true,
        message: "Updated successfully.",
        data:updatedUser
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Error while update user.",
        error: err.message,
      });
    }
  },
  getPasswordById: async (req, res) => {
    try {
      let companyId = req.setCompanyId
      let companyParam = {'userInfo.companyId': companyId}
      const roleName = req.user.userInfo.roleName
      if(roleName && (roleName==='TOPADMIN' || roleName==='SUPER_ADMIN')){
        companyParam = {}
      }
      let user =  await userModel.findOne({$and:[{_id:req.params.id}, companyParam]});
      if(!user){
        return res.status(400).json({
          success: false,
          message: "user not belongs to your company",
        });
      }
      const data={
        fullName: user.userInfo.fullName,
        roleName : user.userInfo.roleName,
        userId : user.userInfo.userId,
        password : passwordDecryptAES(user.userInfo.password)
      }
      return res.status(200).json({
        success: true,
        message: "Get successfully.",
        data: data
      })
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Error while getting password.",
        error: err.message,
      });
    }
  },
  getCompany: async (req, res) => {
    try {
      let roleParam = {'userInfo.roleName':{$in:['INSTANCE ADMIN','ADMIN']}}
      let user =  await userModel.find({$and:[{deleted: false}, roleParam]});
      // if(use){
      //   return res.status(400).json({
      //     success: false,
      //     message: "company not found",
      //   });
      // }
      return res.status(200).json({
        success: true,
        message: "Get successfully.",
        data: user
      })
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Error while getting password.",
        error: err.message,
      });
    }
  },
  resetPassword: async (req, res) => {
    try {
      let roleParam = {'userInfo.roleName':{$in:['INSTANCE ADMIN','ADMIN']}}
      let user =  await userModel.findOne({$and:[{'_id':req.params.id},{deleted: false}, roleParam]});
      if(!user){
        return res.status(400).json({
          success: false,
          message: "company/vendor not found",
        });
      }
      if(user){
        const newEncryptedPassword =  passwordEncryptAES(req.body.newPassword)
        user.userInfo.password = newEncryptedPassword
        const updateUser =  await userModel.findOneAndUpdate({'_id':user._id},user);
        if(updateUser){
          return res.status(200).json({
            success: true,
            message: "Successfully password updated.",
          });
        }else{
          return res.status(400).json({
            success: false,
            message: "Password not updated, please try again!",
          });
        }
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: "Error while getting password.",
        error: err.message,
      });
    }
  },
  addWorkDetail: async(req, res, next)=>{
    try{
      const newWorkDetail= new workDetailModel({
        ...req.body
      });
      const newWorkDetailCreated = await newWorkDetail.save();
      if(newWorkDetailCreated){
        return res.status(200).json({
          success: true,
          message:'Success'
        });
      }else{
        return res.status(200).json({
          success: false,
          message:'Error, Please try again!'
        });
      }
    }catch(err){
      return res.status(400).json({
        success: false,
        message:'Error while adding work detail',
        error: err.message,
      });
    }
  },
  updateWorkDetail: async(req, res, next)=>{
    try{
       const workDetailId= req.body.selectedWorkDetailId
      const updateWorkDetail = await workDetailModel.findOneAndUpdate({_id:workDetailId},{...req.body})
      if(updateWorkDetail){
        return res.status(200).json({
          success: true,
          message:'Update Successfully'
        });
      }else{
        return res.status(200).json({
          success: false,
          message:'Error, Please try again!'
        });
      }
    }catch(err){
      return res.status(400).json({
        success: false,
        message:'Error while updating work detail',
        error: err.message,
      });
    }
  },
  getWorkDetail: async (req, res) => {
    try {
        let companyId = req.setCompanyId
        let companyParam={companyId: companyId}
        const roleName = req.user.userInfo.roleName
        if(roleName&& roleName==='TOPADMIN'){
          companyParam= {}
        }
     
      const allWorkDetailData = await workDetailModel.find(companyParam);
      if(!allWorkDetailData){
        return res.status(200).json({
          success: false,
          message:'Work detail not found.'
        });
      }else{
        return res.status(200).json({
          success: true,
          data:allWorkDetailData,
        });
      }
  
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while getting work deatil.",
        error: err.message,
      });
    }
  },

  addReciever: async (req, res) => {
    try {
        
      recieverModel.create(req.body).then((response, err)=>{
         if(err){
          console.log("err", err)
          return res.status(400).json({
            success: false,
            message: "Error",
            error: err.message,
          });
         }else{
          return res.status(200).json({
            success: true,
            message:'Reciever created successfully'
          });
         }
      })
        let companyId = req.setCompanyId
        let companyParam={companyId: companyId}
        const roleName = req.user.userInfo.roleName
        if(roleName&& roleName==='TOPADMIN'){
          companyParam= {}
        }
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while creating reciever",
        error: err.message,
      });
    }
  },
  getReciever: async (req, res) => {
    try {
        let companyId = req.setCompanyId
        let companyParam={companyId: companyId}
        const roleName = req.user.userInfo.roleName
        if(roleName&& roleName==='TOPADMIN'){
          companyParam= {}
        }
     
      const allRecieverData = await recieverModel.find(companyParam);
      if(!allRecieverData){
        return res.status(200).json({
          success: false,
          message:'Reciever detail not found.'
        });
      }else{
        return res.status(200).json({
          success: true,
          data:allRecieverData,
        });
      }
  
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        success: false,
        message: "Error while getting reciever deatil.",
        error: err.message,
      });
    }
  },
};