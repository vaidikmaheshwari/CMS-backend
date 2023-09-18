const { validateContact, Contact } = require("../models/Contact");
const auth = require("../middlewares/auth");
const ExcelJS = require('exceljs');
const mongoose = require("mongoose");
const router = require("express").Router();
const User = require('../models/User') 
// create contact.
router.post("/contact", auth, async (req, res) => {
  const { error } = validateContact(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { name, address, email, phone } = req.body;

  try {
    const newContact = new Contact({
      name,
      address,
      email,
      phone,
      postedBy: req.user._id,
    });
    const result = await newContact.save();

    return res.status(201).json({ ...result._doc });
  } catch (err) {
    console.log(err);
  }
});

// fetch contact.
router.get("/mycontacts", auth, async (req, res) => {
  try {
    const myContacts = await Contact.find({ postedBy: req.user._id }).populate(
      "postedBy",
      "-password"
    );

    return res.status(200).json({ contacts: myContacts.reverse() });
  } catch (err) {
    console.log(err);
  }
});

// update contact.
router.put("/contact", auth, async (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).json({ error: "no id specified." });
  if (!mongoose.isValidObjectId(id))
    return res.status(400).json({ error: "please enter a valid id" });

  try {
    const contact = await Contact.findOne({ _id: id });

    if (req.user._id.toString() !== contact.postedBy._id.toString())
      return res
        .status(401)
        .json({ error: "you can't edit other people contacts!" });

    const updatedData = { ...req.body, id: undefined };
    const result = await Contact.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    return res.status(200).json({ ...result._doc });
  } catch (err) {
    console.log(err);
  }
});

// delete a contact.
router.delete("/delete/:id", auth, async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ error: "no id specified." });

  if (!mongoose.isValidObjectId(id))
    return res.status(400).json({ error: "please enter a valid id" });
  try {
    const contact = await Contact.findOne({ _id: id });
    if (!contact) return res.status(400).json({ error: "no contact found" });

    if (req.user._id.toString() !== contact.postedBy._id.toString())
      return res
        .status(401)
        .json({ error: "you can't delete other people contacts!" });

    const result = await Contact.deleteOne({ _id: id });
    const myContacts = await Contact.find({ postedBy: req.user._id }).populate(
      "postedBy",
      "-password"
    );

    return res
      .status(200)
      .json({ ...contact._doc, myContacts: myContacts.reverse() });
  } catch (err) {
    console.log(err);
  }
});

// to get a single contact.
router.get("/contact/:id", auth, async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ error: "no id specified." });

  if (!mongoose.isValidObjectId(id))
    return res.status(400).json({ error: "please enter a valid id" });

  try {
    const contact = await Contact.findOne({ _id: id });

    return res.status(200).json({ ...contact._doc });
  } catch (err) {
    console.log(err);
  }
});


router.get('/export/:userId', async (req, res, next) => {
  try {
      const {  userId } = req.params;
      const userExists = await User.findById(userId);
      if (!userExists)   return res.status(400).json({ error: "please enter a valid id" });
      const myContacts = await Contact.find({ postedBy: userId}).populate(
        "postedBy",
        "-password"
      );
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('myContacts');
      worksheet.columns = [
          {header:'S.No',key:'sno',width:10},
          { header: 'Name', key: 'name', width: 30},
          { header: ' Address', key: 'address', width: 30 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Phone', key: 'phone', width: 30},
        
      ];
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { horizontal: 'center' };
      worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' }
      };
      worksheet.getColumn(1).alignment = { horizontal: 'center' };
      worksheet.getColumn(1).font = { bold: true };
      worksheet.getColumn(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' }
      };


      let sno = 1;
     myContacts.forEach((contact)=>{
          const row = {
              sno,
              name:contact.name,
              address:contact.address,
              email: contact.email,
              phone:contact.phone,
          };
          worksheet.addRow(row);
          sno++;
      });
      
      const fileName = `myContacts.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      await workbook.xlsx.write(res);
      res.status(200).end();
  }
  catch (error) {
      next(error);
  }
});

module.exports = router;