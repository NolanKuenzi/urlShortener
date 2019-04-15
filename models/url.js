import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
    url: {
        type: String,
        unique: true,
    },
    short_url: {
        type: Number,
        unique: true,
    }
});

const Url = mongoose.model('Url', urlSchema);
export default Url;