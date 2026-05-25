const Order = require("../models/Order");
const Service = require("../models/Servicemodel");
const Customer = require("../models/Customer");

exports.createOrder = async (req, res) => {

  try {

    const customerId = req.user.id;

    const {
      items,
      pickupAddress,
      deliveryAddress,
      paymentMethod
    } = req.body;


    if (!items || items.length === 0) {

      return res.status(400).json({
        success: false,
        message: "Cart empty"
      })

    }

    let finalItems = [];
    let subtotal = 0;


    for (const item of items) {

      const service = await Service.findById(
        item.serviceId
      );

      if (!service) {

        return res.status(400).json({
          success: false,
          message: `Invalid service`
        })

      }

      const unitPrice =
        service.pricePerKg;

      const totalPrice =
        unitPrice * item.quantity;

      subtotal += totalPrice;

      finalItems.push({

        serviceId: service._id,
        serviceName: service.name,

        categoryName:
          item.categoryName,

        subCategoryName:
          item.subCategoryName,

        quantity: item.quantity,

        unitPrice,
        totalPrice

      })

    }


    const tax = +(subtotal * 0.05).toFixed(2);

    const discount = 0;

    const totalAmount =
      subtotal +
      tax -
      discount;


    const orderNumber =
      `KR${Date.now()}`;


    const order = await Order.create({

      customerId,

      orderNumber,

      items: finalItems,

      subtotal,

      tax,

      discount,

      totalAmount,

      pickupAddress,

      deliveryAddress,

      paymentMethod,

      statusHistory: [
        {
          status: "pending_sp"
        }
      ]

    });


    res.status(201).json({

      success: true,
      message: "Order created",
      data: order

    })


  }
  catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,
      message: error.message

    })

  }

}




// Active order

exports.getActiveOrder = async (
  req,
  res
) => {

  try {

    const customerId = req.user.id;

    const activeOrder =
      await Order.findOne({

        customerId,

        status: {
          $nin: [
            "delivered",
            "cancelled"
          ]
        }

      })
        .sort({
          createdAt: -1
        });

    res.json({

      success: true,
      data: activeOrder

    });

  }
  catch (error) {

    res.status(500).json({

      success: false,
      message: error.message

    });

  }

};




// Recent orders

exports.getRecentOrders =
  async (req, res) => {

    try {

      const customerId =
        req.user.id;

      const orders =
        await Order.find({

          customerId

        })

          .sort({
            createdAt: -1
          })

          .limit(10);

      res.json({

        success: true,
        data: orders

      });

    }
    catch (error) {

      res.status(500).json({

        success: false,
        message: error.message

      });

    }

  };




// Order details

exports.getOrderDetails =
  async (req, res) => {

    try {

      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {

        return res.status(404)
          .json({

            success: false,
            message:
              "Order not found"

          });

      }

      res.json({

        success: true,
        data: order

      });

    }
    catch (error) {

      res.status(500)
        .json({

          success: false,
          message: error.message

        });

    }

  };




// Update status

exports.updateStatus =
  async (req, res) => {

    try {

      const { status } =
        req.body;

      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {

        return res.status(404)
          .json({

            success: false,
            message: "Order not found"

          });

      }

      order.status = status;

      order.statusHistory.push({

        status

      });

      await order.save();

      res.json({

        success: true,
        message:
          "Status updated"

      });

    }
    catch (error) {

      res.status(500)
        .json({

          success: false,
          message: error.message

        });

    }

  };