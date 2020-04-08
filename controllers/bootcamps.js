const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const Bootcamp = require('../models/Bootcamp');

// @desc      Get bootcamps
// @route     GET /api/v1/bootcamps
// @access    Public
exports.getBootcamps = asyncHandler(async(req, res, next) => {
    res.status(200).json(res.advancedResults);
});

// @desc      Get single bootcamp 
// @route     GET /api/v1/bootcamps/:id
// @access    Public
exports.getBootcampById = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    // if you have 2 handling errors, make return keyword on first
    if (!bootcamp)
        return next(new ErrorResponse(`Bootcamp not found with the id of ${req.params.id}`, 404));

    res
        .status(200)
        .json({ success: true, data: bootcamp });
});

// @desc      Create new bootcamp
// @route     POST /api/v1/bootcamps
// @access    Private
exports.createBootcamp = asyncHandler(async(req, res, next) => {
    // add user to req.body
    req.body.user = req.user.id;

    // check for published bootcamp
    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

    // if the user is not an admin, they can only add one bootcamp
    if (publishedBootcamp && req.user.role !== 'admin') {
        return next(new ErrorResponse(`The user with ID ${req.user.id} has already published a bootcamp`, 400));
    }

    const bootcamp = await Bootcamp.create(req.body);

    res
        .status(201)
        .json({ sucess: true, data: bootcamp });
});

// @desc      Update bootcamp
// @route     PUT /api/v1/bootcamps/:id
// @access    Private
exports.updateBootcamp = asyncHandler(async(req, res, next) => {
    let bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp)
        return next(new ErrorResponse(`Bootcamp not found with the id of ${req.params.id}`, 404));

    // make sure user is bootcamp owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.params.id} is not authorized to update this bootcamp`, 401));
    }

    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    res
        .status(200)
        .json({ success: true, data: bootcamp });
});

// @desc      Delete bootcamp
// @route     DELETE /api/v1/bootcamps/:id
// @access    Private
exports.deleteBootcamp = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp)
        return next(new ErrorResponse(`Bootcamp not found with the id of ${req.params.id}`, 404));

    // make sure user is bootcamp owner
    if (bootcamp.user.toString() !== 'req.user.id' && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.params.id} is not authorized to delete this bootcamp`, 401));
    }

    bootcamp.remove();

    res
        .status(200)
        .json({ success: true, data: {} });
});

// @desc      Get bootcamps within a radius
// @route     GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access    Private
exports.getBootcampsInRadius = asyncHandler(async(req, res, next) => {
    const { zipcode, distance } = req.params;

    //Get lat & lng from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    // Calc radius using radians
    // Devide dist by radius of Earth
    // Earth Radius = 6,963 mi / 6,378 km
    const earthRadius = 6963;
    const radius = distance / earthRadius;

    const bootcamps = await Bootcamp.find({
        location: {
            $geoWithin: {
                $centerSphere: [
                    [lng, lat], radius
                ]
            }
        }
    });

    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    })
});

// @desc      Upload photo for bootcamp
// @route     PUT /api/v1/bootcamps/:id/photo
// @access    Private
exports.bootcampPhotoUpload = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) return next(new ErrorResponse(`Bootcamp not found with the id of ${req.params.id}`, 404));

    if (!req.files) return next(new ErrorResponse(`Please upload a file`, 400));

    const file = req.files.file;

    // make sure the image is a photo
    if (!file.mimetype.startsWith('image')) return next(new ErrorResponse(`Please upload an image file.`, 400));

    // check file size
    if (file.size > process.env.MAX_FILE_UPLOAD) return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 400));

    // create custom filename
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

    //upload file
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
            console.error(err);
            return next(new ErrorResponse(`Problem with file upload`, 500));
        }

        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });

        res.status(200).json({
            sucess: true,
            data: file.name
        });
    });
});