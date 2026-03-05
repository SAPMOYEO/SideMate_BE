const Project = require('../model/Project');
const projectController = {};

projectController.createProject = async(req, res) => {
    try {
        const {title, category, description, goal, startDate, endDate, requiredTechStack, mandatoryTechStack, recruitRoles, totalCnt, deadline, communicationMethod, status, gitUrl, aiFeedbackIds, author} = req.body;
        // const {title, category, description, goal, startDate, endDate, requiredTechStack, mandatoryTechStack, recruitRoles, totalCnt, deadline, communicationMethod, status, gitUrl, aiFeedbackIds} = req.body;
        // const userId = req;
        const project = new Project({title, category, description, goal, startDate, endDate, requiredTechStack, mandatoryTechStack, recruitRoles, totalCnt, deadline, communicationMethod, status, gitUrl, aiFeedbackIds, author});
        // const project = new Proejct({title, category, description, goal, startDate, endDate, requiredTechStack, mandatoryTechStack, recruitRoles, totalCnt, deadline, communicationMethod, status, gitUrl, aiFeedbackIds, author: userId});

        await project.save();

        return res.status(200).json({status: 'success', project});
    } catch (error) {
        return res.status(400).json({status: 'fail', message: error.message});
    }
};

projectController.getProjects = async(req, res) => {
    try {
        const {page, title, category, startDate, endDate, requiredTechStack, recruitRoles, deadline, communicationMethod, status} = req.query;
        const condition = {hiddenYn: false};

        if(title){
            condition.title = {$regex: title, $options: 'i'};
        }
        if(category){
            condition.category = category;
        }
        if(startDate){
            condition.startDate = startDate;
        }
        if(endDate){
            condition.endDate = endDate;
        }
        if(requiredTechStack){
            condition.requiredTechStack = requiredTechStack;
        }
        if(deadline){
            condition.deadline = deadline;
        }
        if(communicationMethod){
            condition.communicationMethod = communicationMethod;
        }
        if(status){
            condition.status = status;
        }
        if(page){

        }

        const project = new Project({title, category, description, goal, startDate, endDate, requiredTechStack, mandatoryTechStack, recruitRoles, totalCnt, deadline, communicationMethod, status, gitUrl, aiFeedbackIds, author});
        // const project = new Proejct({title, category, description, goal, startDate, endDate, requiredTechStack, mandatoryTechStack, recruitRoles, totalCnt, deadline, communicationMethod, status, gitUrl, aiFeedbackIds, author: userId});

        await project.save();

        return res.status(200).json({status: 'success', project});
    } catch (error) {
        return res.status(400).json({status: 'fail', message: error.message});
    }
};

projectController.getProject = async(req, res) => {
    try {
        const {title, category, description, goal, startDate, endDate, requiredTechStack, mandatoryTechStack, recruitRoles, totalCnt, deadline, communicationMethod, status, gitUrl, aiFeedbackIds, author} = req.body;
        // const {title, category, description, goal, startDate, endDate, requiredTechStack, mandatoryTechStack, recruitRoles, totalCnt, deadline, communicationMethod, status, gitUrl, aiFeedbackIds} = req.body;
        // const userId = req;
        const project = new Project({title, category, description, goal, startDate, endDate, requiredTechStack, mandatoryTechStack, recruitRoles, totalCnt, deadline, communicationMethod, status, gitUrl, aiFeedbackIds, author});
        // const project = new Proejct({title, category, description, goal, startDate, endDate, requiredTechStack, mandatoryTechStack, recruitRoles, totalCnt, deadline, communicationMethod, status, gitUrl, aiFeedbackIds, author: userId});

        await project.save();

        return res.status(200).json({status: 'success', project});
    } catch (error) {
        return res.status(400).json({status: 'fail', message: error.message});
    }
};

module.exports = projectController;