
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

exports.updateUserProfile = async (req, res) => {
  const { id } = req.params;

  console.log(id)
  const { username, email } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username, email },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User info updated successfully",
      data: updatedUser
    });

  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

