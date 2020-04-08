const errorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Course = require('../models/Course');
const Bootcamp = require('../models/Bootcamp');

// @desc      Get courses
// @route     GET /api/v1/courses
// @route     GET /api/v1/bootcamps/:bootcampsId/courses
// @access    Public
exports.getCourses = asyncHandler(async(req, res, next) => {
    if (req.params.bootcampId) {
        const courses = await Course.find({ bootcamp: req.params.bootcampId });

        return res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        })
    } else {
        res.status(200).json(res.advancedResults);
    }
});

// @desc      Get single course
// @route     GET /api/v1/courses/:id
// @access    Public
exports.getCourse = asyncHandler(async(req, res, next) => {
    const course = await (await Course.findById(req.params.id)).populate({
        path: 'bootcamp',
        select: 'name description'
    });

    if (!course) return next(new errorResponse(`No course found with the id: ${req.params.id}`), 404);

    res.status(200).json({
        sucess: true,
        data: course
    });
});

// @desc      POST create course
// @route     POST /api/v1/courses
// @access    Private
exports.addCourse = asyncHandler(async(req, res, next) => {
    req.body.bootcamp = req.params.bootcampId;

    const bootcamp = await Bootcamp.findById(req.params.bootcampId);

    if (!bootcamp) return next(new errorResponse(`No bootcamp with the id: ${req.params.bootcampId}`), 404);

    const course = await Course.create(req.body);

    res.status(200).json({
        sucess: true,
        data: course
    });
});

// @desc      UPDATE course
// @route     PUT /api/v1/courses/:id
// @access    Private
exports.updateCourse = asyncHandler(async(req, res, next) => {
    let course = await Course.findById(req.params.id);

    if (!course) return next(new errorResponse(`No course with the id: ${req.params.id}`), 404);

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        sucess: true,
        data: course
    });
});


// @desc      DELETE course
// @route     delete /api/v1/courses/:id
// @access    Private
exports.deleteCourse = asyncHandler(async(req, res, next) => {
    let course = await Course.findById(req.params.id);

    if (!course) return next(new errorResponse(`Course not found with the id: ${req.params.id}`), 404);

    await course.remove();

    res.status(200).json({
        sucess: true,
        data: course
    });
});