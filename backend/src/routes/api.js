import pkg from 'express'
import mongoose from 'mongoose'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import moment from 'moment'

const {Router}=pkg
const router = Router()
//Generated by www.allkeysgenerator.com
const TOKEN_SECRET = '635266556A586E3272357538782F413F4428472B4B6250645367566B5970337336763979244226452948404D6351665468576D5A7134743777217A25432A462D4A614E645267556B586E3272357538782F413F4428472B4B6250655368566D5971337336763979244226452948404D635166546A576E5A7234753777217A25432A462D4A614E645267556B58703273357638792F413F4428472B4B6250655368566D597133743677397A244326452948404D635166546A576E5A7234753778214125442A472D4A614E645267556B58703273357638792F423F4528482B4D6250655368566D597133743677397A24432646294A404E635266546A576E5A7234753778214125442A472D4B6150645367566B58703273357638792F423F4528482B4D6251655468576D5A7133743677397A24432646294A404E635266556A586E327235753778214125442A472D4B6150645367566B59703373367639792F423F4528482B4D6251655468576D5A7134743777217A25432646294A404E635266556A586E3272357538782F413F4428472D4B6150645367566B5970337336763979244226452948404D6251655468576D5A7134743777217A25432A462D4A614E645266556A586E3272357538782F413F4428472B4B6250655368566B5970337336763979244226452948404D635166546A576E5A7134743777217A25432A462D4A61'

const userSchema= new mongoose.Schema({
  username:{type: String, unique: true, index:true, required: true, trim: true},
  password:{type: String, select: false},
  payed:{type: Boolean, select: true}
})
const User = mongoose.model('User', userSchema)

const newsSchema= new mongoose.Schema({
  username:{type: String, unique: true, index:true, required: true, trim: true},
  news:{type: Array}
})
const News = mongoose.model('News', newsSchema)
router.post('/generatenews', async (req, res) => {
  await News.create({username:"test", news:["asd","asdq","asdqasd"]})
})

router.post('/news', async (req, res) => {
  const {user} = req.body
  const response = await News.findOne({username:user})
  res.send({news: response.news })
})

router.get('/servertime', async (req, res) => {
  var time= moment().local()
  res.send({ time: time})
})

router.post('/login', async (req, res, next) => {
  const {username, password} = req.body
  const user = await User.findOne({username}).select('+password')
  if(!user){
    res.json({msg: 'No such user'})
    next("No such user")
  } else{
    const match = await argon2.verify(user.password, password)
    if(!match){
      res.json({msg: 'Wrong password'})
      next("Wrong password")
    } else{
      const token = await jwt.sign({userId: user.id},TOKEN_SECRET,{
      expiresIn: '1m'
    })
    res.cookie('auth', token, {httpOnly:true})
    res.json({msg: token, success:true})
    }
  }
  res.json({msg: token})
})

router.post('/register', async (req, res, next) => {
  const{username, password}=req.body
  const user = await User.findOne({ username})
  if(user){
    res.json({msg: 'already exists'})
    next('User exists')
  } else{
    //argon2 for extra protecion
    const hashed = await argon2.hash(password, 10)
    const Created = await User.create({username, password: hashed, payed: false})
    res.json({msg: Created.id})
  }
})

const authMW =async(req, res, next)=>{
  console.log("in authMW")
  try {
      //const token = req.headers?.authorization?.replace('Bearer ', '')
      const token = req.cookies.auth
      jwt.verify(token, TOKEN_SECRET)
      next()
  } catch (error) {
    console.log("error at authMW")
    next(error)
  }
}

router.get('/checklogin', authMW, async (req, res, next)=>{
  res.json({msg: true})
})

router.post('/membersndues', authMW, async (req, res, next)=>{
  const{user}=req.body
  const userFromDB = await User.findOne({username:user}).select('+payed')
  var response = (userFromDB.payed)
  res.json({msg: response})
  next()
})


router.post('/newsForAPerson', authMW, async (req, res, next)=>{
  const{user}=req.body
  const userFromDB = await User.findOne({username:user}).select('+payed')
  var response = (userFromDB.payed)
  res.json({msg: response})
  next()
})

router.put('/pay', authMW, async (req, res, next)=>{
  const{user}=req.body
  const userFromDB = await User.findOne({username:user}).select('+payed')
  if(userFromDB.payed===true){
    await User.findOneAndUpdate({username:user, payed:false})
  } else{
    await User.findOneAndUpdate({username:user, payed:true})
  }
  const userFromDB2 = await User.findOne({username:user}).select('+payed')
  res.json({msg: userFromDB2.payed})
  next()
})


router.delete('/deleteme', authMW, async (req, res, next)=>{
  const{user}=req.body
  await User.findOneAndDelete({username:user})
  await User.findOne({username:user}).select('+payed')
  res.json({msg: "successfully"})
  next()
})

router.get('/csrf-protection', async (req, res) => {
  res.json({csrfToken: req.csrfToken()})
})

export default router
