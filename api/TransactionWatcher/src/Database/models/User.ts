import mongoose, { Document, Schema} from "mongoose";

export interface IUser {
    address: String;
}

export interface IUserModel extends IUser, Document {}

const UserSchema : Schema = new Schema (
    {
        address: { type: String, required: true }
    },
    {
        versionKey: false
    }
)

export default mongoose.model<IUserModel>("User", UserSchema)