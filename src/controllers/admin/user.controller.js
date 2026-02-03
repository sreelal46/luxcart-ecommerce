const { OK } = require("../../constant/statusCode");
const User = require("../../models/user/UserModel");
const mongoose = require("mongoose");
//User Management
const usersManagement = async (req, res, next) => {
  try {
    let {
      search = "",
      page = 1,
      limit = 10,
      ajax,
      status,
      authProvider,
      verified,
      minOrders,
      minWallet,
    } = req.query;

    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    /* ---------------- BASE MATCH ---------------- */
    const matchConditions = {};

    if (search.trim()) {
      matchConditions.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (status === "active") matchConditions.isBlocked = false;
    if (status === "blocked") matchConditions.isBlocked = true;

    if (authProvider) matchConditions.authProvider = authProvider;

    if (verified !== undefined && verified !== "") {
      matchConditions.isVerified = verified === "true";
    }

    /* ---------------- AGGREGATION PIPELINE ---------------- */
    const pipeline = [
      { $match: matchConditions },

      /* ORDERS LOOKUP */
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "userId",
          as: "orders",
        },
      },
      {
        $addFields: {
          orderCount: { $size: "$orders" },
        },
      },

      /* WALLET LOOKUP (SOURCE OF TRUTH) */
      {
        $lookup: {
          from: "wallets",
          localField: "_id",
          foreignField: "userId",
          as: "wallet",
        },
      },
      {
        $addFields: {
          walletBalance: {
            $ifNull: [{ $arrayElemAt: ["$wallet.balance", 0] }, 0],
          },
        },
      },
    ];

    /* -------- POST-LOOKUP FILTERS -------- */
    if (minOrders) {
      pipeline.push({
        $match: { orderCount: { $gte: Number(minOrders) } },
      });
    }

    if (minWallet) {
      pipeline.push({
        $match: { walletBalance: { $gte: Number(minWallet) } },
      });
    }

    /* ---------------- COUNT FOR PAGINATION ---------------- */
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await User.aggregate(countPipeline);
    const totalCount = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    /* ---------------- FINAL PIPELINE ---------------- */
    pipeline.push(
      {
        $project: {
          password: 0,
          orders: 0,
          wallet: 0,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    );

    const users = await User.aggregate(pipeline);

    /* ---------------- DASHBOARD STATS ---------------- */
    const [totalUsers, activeUsers, blockedUsers] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isBlocked: false }),
      User.countDocuments({ isBlocked: true }),
    ]);

    const stats = { totalUsers, activeUsers, blockedUsers };

    /* ---------------- AJAX RESPONSE ---------------- */
    if (ajax) {
      return res.status(200).json({
        success: true,
        users,
        pagination: {
          totalPages,
          currentPage: page,
          totalCount,
        },
        stats,
      });
    }

    /* ---------------- PAGE LOAD ---------------- */
    res.render("admin/users/usersManagement", {
      users,
      currentPage: page,
      totalPages,
      totalUsers,
      activeUsers,
      blockedUsers,
    });
  } catch (error) {
    console.error("Users management error:", error);
    next(error);
  }
};

const usersManagementDetail = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const user = await User.aggregate([
      {
        $match: { _id: userId },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "userId",
          as: "orders",
        },
      },
      {
        $addFields: {
          orderCount: { $size: "$orders" },
          // Calculate total spent from orders with 'Paid' or 'Partially Paid' status
          totalSpent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$orders",
                    as: "order",
                    cond: {
                      $in: [
                        "$$order.paymentStatus",
                        ["Paid", "Partially Paid"],
                      ],
                    },
                  },
                },
                as: "order",
                in: "$$order.paidAmount",
              },
            },
          },
        },
      },
      // DON'T remove orders - we need them for the transaction history table
    ]);

    if (!user.length) {
      return res.status(NOT_FOUND).render("errors/404");
    }

    console.log("user details", user[0]);
    console.log("user orders", user[0].orders);

    // Pass the user data including orders
    res.status(OK).render("admin/users/userDetails", {
      user: user[0],
      orders: user[0].orders || [],
      totalSpent: user[0].totalSpent || 0,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const blockOrUnblockUser = async (req, res, next) => {
  try {
    //collecting user data
    const userId = req.params.id;
    const user = await User.findById(userId);
    let status;

    //Updateing user
    if (user.isBlocked) {
      await User.findByIdAndUpdate(userId, {
        $set: { isBlocked: false },
      });
      status = "Unblock";
    } else {
      await User.findByIdAndUpdate(userId, {
        $set: { isBlocked: true },
      });
      status = "Block";
    }

    await res.status(OK).json({ success: true, status });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = { blockOrUnblockUser, usersManagementDetail, usersManagement };
