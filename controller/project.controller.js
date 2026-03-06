const Project = require('../model/Project');
const PAGE_SIZE = process.env.PAGE_SIZE;
const projectController = {};

projectController.createProject = async(req, res) => {
    try {
        const {title, category, description, goal, startDate, endDate, requiredTechStack, mandatoryTechStack, recruitRoles, totalCnt, deadline, communicationMethod, status, gitUrl, aiFeedbackIds} = req.body;
        const {userId} = req;
        const project = new Project({title, category, description, goal, startDate, endDate, requiredTechStack, mandatoryTechStack, recruitRoles, totalCnt, deadline, communicationMethod, status, gitUrl, aiFeedbackIds, author: userId});

        await project.save();

        return res.status(200).json({status: 'success', project});
    } catch (error) {
        return res.status(400).json({status: 'fail', message: error.message});
    }
};

projectController.getProjects = async(req, res) => {
    try {
        const {page, title, category, startDate, endDate, requiredTechStack, recruitRoles, deadlineStartDate, deadlineEndDate, communicationMethod, status} = req.query;
        const condition = {hiddenYn: false};

        if(title){
            condition.title = {$regex: title, $options: 'i'};
        }
        if(category){
            condition.category = category;
        }
        if(startDate){
            condition.startDate = {$gte: new Date(startDate)};
        }
        if(endDate){
            condition.endDate = {$lte: new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1))};
        }
        if(requiredTechStack){
            condition.requiredTechStack = requiredTechStack;
        }
        if(recruitRoles){
            condition['recruitRoles.role'] = recruitRoles;
        }
        if(deadlineStartDate && deadlineEndDate){
            condition.deadline = {$gte: new Date(deadlineStartDate), $lte: new Date(new Date(deadlineEndDate).setDate(new Date(deadlineEndDate).getDate() + 1))};
        } else{
            if(deadlineStartDate){
                condition.deadline = {$gte: new Date(deadlineStartDate)};
            }
            if(deadlineEndDate){
                condition.deadline = {$lt: new Date(new Date(deadlineEndDate).setDate(new Date(deadlineEndDate).getDate() + 1))};
            }
        }
        if(communicationMethod){
            condition.communicationMethod = communicationMethod;
        }
        if(status){
            condition.status = status;
        }

        let query = Project.find(condition);
        let response = {status: 'success'};

        if(page){
            query.skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE);
            const totalItemNum = await Project.countDocuments(condition);
            const totalPageNum = Math.ceil(totalItemNum/PAGE_SIZE);
            response.totalPageNum = totalPageNum;
        }

        const projectList = await query.exec();
        response.data = projectList

        return res.status(200).json(response);
    } catch (error) {
        return res.status(400).json({status: 'fail', message: error.message});
    }
};

projectController.getProject = async(req, res) => {
    try {
        const projectId = req.params.id;
        const project = await Project.findById(projectId);

        if(project){
            return res.status(200).json({status: 'success', data: project});
        }

        throw new Error('해당 프로젝트를 찾을 수 없습니다.');
    } catch (error) {
        return res.status(400).json({status: 'fail', message: error.message});
    }
};

projectController.updateProject = async(req, res) => {
    try {
        const projectId = req.params.id;
        const {title, category, description, goal, startDate, endDate, requiredTechStack, mandatoryTechStack, recruitRoles, totalCnt, deadline, communicationMethod, status, gitUrl, aiFeedbackIds} = req.body;
        const {userId} = req;
        const project = await Project.findByIdAndUpdate({_id: projectId}, {title, category, description, goal, startDate, endDate, requiredTechStack, mandatoryTechStack, recruitRoles, totalCnt, deadline, communicationMethod, status, gitUrl, aiFeedbackIds, author: userId}, {new: true});

        return res.status(200).json({status: 'success', project});
    } catch (error) {
        return res.status(400).json({status: 'fail', message: error.message});
    }
};

projectController.deleteProject = async(req, res) => {
    try {
        const projectId = req.params.id;
        const {userId} = req;
        await Project.findByIdAndDelete(projectId);

        return res.status(200).json({status: 'success'});
    } catch (error) {
        return res.status(400).json({status: 'fail', message: error.message});
    }
};

module.exports = projectController;