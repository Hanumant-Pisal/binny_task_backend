
const User = require("../models/User.models")

exports.getUserProfile = async(req, res) => {
    const { id } = req.params;
    try {
          const userdata = await User.findById(id).select('-passwordHash')

          if(!userdata){
            return res.status(400).json({message:"user not found"})
          }

          return res.status(200).json({
            status:"Success",
            data:userdata
          })
        
    } catch (error) {
        return res.status(500).json({message:"server error"})
    }
}


