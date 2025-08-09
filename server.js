/*********************************************************************************
 *  WEB322 – Assignment 5
 *  I declare that this assignment is my own work in accordance with Seneca Academic Policy.
 *  No part of this assignment has been copied manually or electronically from any other source
 *  (including web sites) or distributed to other students.
 *
 *  Name: Tanmay Goyal 
 *  Student ID: 132737248
 ********************************************************************************/

const express = require("express");
const projectData = require("./modules/projects");
const path = require("path");
const app = express();
const authData = require("./modules/auth-service");
const clientSessions = require("client-sessions");
const PORT = 3000;

function requireAuth(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.use(express.urlencoded({ extended: true }));
app.use(
  clientSessions({
    cookieName: "session",
    secret: "o6LjQ5EVNC28ZgK64hDELM18ScpFQr",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60,
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.get("/", (req, res) => {
  res.render("home", { page: "/" });
});

app.get("/about", (req, res) => {
  res.render("about", { page: "/about" });
});

app.get("/solutions/projects", (req, res) => {
  const sector = req.query.sector;

  if (sector) {
    projectData
      .getProjectsBySector(sector)
      .then((projects) =>
        res.render("projects", { projects, page: "/solutions/projects" })
      )
      .catch(() =>
        res.status(404).render("404", {
          message: `No projects found for sector: ${sector}`,
          page: "/solutions/projects",
        })
      );
  } else {
    projectData
      .getAllProjects()
      .then((projects) =>
        res.render("projects", { projects, page: "/solutions/projects" })
      )
      .catch(() =>
        res.status(404).render("404", {
          message: "Unable to load projects.",
          page: "/solutions/projects",
        })
      );
  }
});

app.get("/solutions/projects/:id", (req, res) => {
  const projectId = parseInt(req.params.id);

  projectData
    .getProjectById(projectId)
    .then((project) =>
      res.render("project", { project, page: "/solutions/projects" })
    )
    .catch(() =>
      res.status(404).render("404", {
        message: `No project found with ID: ${req.params.id}`,
        page: "/solutions/projects",
      })
    );
});

app.get("/solutions/addProject", requireAuth, (req, res) => {
  projectData
    .getAllSectors()
    .then((sectorData) => {
      res.render("addProject", {
        sectors: sectorData,
        page: "/solutions/addProject",
      });
    })
    .catch((err) => {
      res.render("500", { message: `Error loading sectors: ${err}` });
    });
});

app.post("/solutions/addProject", requireAuth, (req, res) => {
  projectData
    .addProject(req.body)
    .then(() => res.redirect("/solutions/projects"))
    .catch((err) => {
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
    });
});

app.post("/solutions/editProject", requireAuth, (req, res) => {
  const id = req.body.id;

  projectData
    .editProject(id, req.body)
    .then(() => res.redirect("/solutions/projects"))
    .catch((err) => {
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
    });
});

app.get("/solutions/deleteProject/:id", requireAuth, (req, res) => {
  const projectId = parseInt(req.params.id);

  projectData
    .deleteProject(projectId)
    .then(() => {
      res.redirect("/solutions/projects");
    })
    .catch((err) => {
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
    });
});

app.get("/solutions/editProject/:id", requireAuth, (req, res) => {
  const projectId = req.params.id;

  Promise.all([
    projectData.getProjectById(projectId),
    projectData.getAllSectors(),
  ])
    .then(([project, sectors]) => {
      res.render("editProject", { project, sectors });
    })
    .catch((err) => {
      res.status(404).render("404", {
        message: `Error loading project or sectors: ${err}`,
        page: "",
      });
    });
});



app.get("/login", (req, res) => {
  res.render("login", {
    errorMessage: "",
    userName: "",
    page: "/login",
  });
});

app.get("/register", (req, res) => {
  res.render("register", {
    errorMessage: "",
    successMessage: "",
    userName: "",
    page: "/register",
  });
});

app.post("/register", (req, res) => {
  authData
    .registerUser(req.body)
    .then(() => {
      res.render("register", {
        successMessage: "User created",
        errorMessage: "",
        userName: "",
      });
    })
    .catch((err) => {
      res.render("register", {
        successMessage: "",
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");

  authData
    .checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      };
      res.redirect("/solutions/projects");
    })
    .catch((err) => {
      res.render("login", {
        errorMessage: err,
        userName: req.body.userName,
      });
    });
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", requireAuth, (req, res) => {
  res.render("userHistory", { page: "/userHistory" });
});

app.use((req, res) => {
  res.status(404).render("404", {
    message: "Sorry, the page you're looking for doesn't exist.",
    page: "",
  });
});

projectData
  .initialize()
  .then(authData.initialize)
  .then(() => {
    console.log("Project data initialized successfully.");
    app.listen(PORT, () => console.log("Server is running on port " + PORT));
  })
  .catch((error) => {
    console.log("Failed to initialize project data:", error);
  });

  // Add at the bottom
if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => console.log(`Local server running on ${PORT}`));
}