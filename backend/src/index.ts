import 'dotenv/config';
import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

async function start(){
    const uri = process.env.MONGO_URI;
    if(!uri) throw new Error('MONGO_URI is not set');
    await connectDB(uri);
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

start().catch((err) =>{
    console.error('Failed to start server', err);
    process.exit(1);
})