import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";

export const createUser = (address: string) => {

  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    address,
  });

  return user
    .save()
    .then((user) => console.log("success", user))
    .catch((error) => {
      console.error(error);
    });
};
export const readUser = async(userId: string) => {
  const user = User.find({ address: userId })
  return user
//   console.log(user)
};
export const readAllUser = (req: Request, res: Response, next: NextFunction) => {
  return User.find()
    .then((user) => {
      res.status(200).json({ user });
    })
    .catch((error) => res.status(500).json({ error }));
};
export const updateUser = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.userId;
  return User.findById(userId)
    .then((user) => {
      if (user) {
        user.set(req.body);
        return user
          .save()
          .then((user) => res.status(200).json({ user }))
          .catch((error) => res.status(500).json({ error }));
      } else {
        res.status(404).json({ message: "Not found" });
      }
    })
    .catch((error) => res.status(500).json({ error }));
};
export const deleteUser = (req: Request, res: Response, next: NextFunction) => {
     const userId = req.params.userId;

     return User.findByIdAndDelete(userId).then((user) => (user ? res.status(201).json({ message: "deleted" }) : res.status(404).json({ message: "Not found" })))
};

