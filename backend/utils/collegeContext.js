const College = require('../models/College');
const User = require('../models/User');

const resolveCollegeContext = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  let college = null;
  if (user.collegeId) {
    college = await College.findById(user.collegeId);
  }

  if (!college && user.college) {
    college = await College.findOne({ name: user.college });
  }

  if (!college) {
    throw new Error('College information not found for this user');
  }

  return {
    user,
    college,
    collegeId: college._id,
    collegeName: college.name
  };
};

module.exports = { resolveCollegeContext };
