import mongoose from 'mongoose'


export const ConnectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`Mongodb Connected : ${conn.connection.host}`)
    } catch (error) {
        console.log("Mongodb connection error :",error)
    }
}

export default ConnectDB