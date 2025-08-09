/*********************************************************************************
 *  WEB322 – Assignment 5
 *  I declare that this assignment is my own work in accordance with Seneca Academic Policy.
 *  No part of this assignment has been copied manually or electronically from any other source
 *  (including web sites) or distributed to other students.
 *
 *  Name: Tanmay Goyal 
 *  Student ID: 132737248
 ********************************************************************************/

require("dotenv").config();
require("pg");
const { Sequelize, Op } = require("sequelize");

let sequelize = new Sequelize({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
  define: {
    timestamps: false,
  },
});

const Sector = sequelize.define("Sector", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sector_name: Sequelize.STRING,
});

const Project = sequelize.define("Project", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: Sequelize.STRING,
  feature_img_url: Sequelize.STRING,
  summary_short: Sequelize.TEXT,
  intro_short: Sequelize.TEXT,
  impact: Sequelize.TEXT,
  original_source_url: Sequelize.STRING,
  sector_id: Sequelize.INTEGER,
});

Project.belongsTo(Sector, { foreignKey: "sector_id" });

function initialize() {
  return sequelize
    .sync()
    .then(() => Promise.resolve())
    .catch((err) => Promise.reject(err));
}

function getAllProjects() {
  return Project.findAll({
    include: [Sector],
  });
}

function getProjectsBySector(sector) {
  return Project.findAll({
    include: [Sector],
    where: {
      "$Sector.sector_name$": {
        [Op.iLike]: `%${sector}%`,
      },
    },
  }).then((projects) => {
    if (projects.length > 0) {
      return projects;
    } else {
      return Promise.reject("Unable to find requested projects");
    }
  });
}

function findProjectById(projectId) {
  return Project.findAll({
    where: { id: projectId },
    include: [Sector],
  }).then((projects) => {
    if (projects.length > 0) {
      return projects[0];
    } else {
      return Promise.reject("Unable to find requested project");
    }
  });
}



function addProject(projectData) {
  return new Promise(async (resolve, reject) => {
    try {
      await Project.create(projectData);
      resolve();
    } catch (err) {
      reject(err.errors[0].message);
    }
  });
}

function getAllSectors() {
  return new Promise(async (resolve, reject) => {
    try {
      const sectors = await Sector.findAll();
      resolve(sectors);
    } catch (err) {
      reject("Unable to retrieve sectors");
    }
  });
}

function updateProject(id, projectData) {
  return new Promise((resolve, reject) => {
    Project.update(projectData, {
      where: { id },
    })
      .then(([updatedRows]) => {
        if (updatedRows === 0) {
          reject("No project found to update.");
        } else {
          resolve();
        }
      })
      .catch((err) => {
        reject(err.errors?.[0]?.message || err.message);
      });
  });
}

function deleteProject(id) {
  return new Promise((resolve, reject) => {
    Project.destroy({ where: { id } })
      .then((deletedCount) => {
        if (deletedCount === 0) {
          reject("Project not found");
        } else {
          resolve();
        }
      })
      .catch((err) => {
        reject(err.errors ? err.errors[0].message : err.message);
      });
  });
}

module.exports = {
  initialize,
  getAllProjects,
  findProjectById,
  getProjectsBySector,
  addProject,
  getAllSectors,
  updateProject,
  deleteProject,
};
