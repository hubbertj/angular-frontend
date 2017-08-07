# README #
This is the frontend project for project HOPE

#How to run the project#
1. Install npm
2. Install bower:   npm install -g bower
3. Run npm install
4. Run bower install
5. Edit the .env file with your wanted configurations
	all configs are located in the config/ dir.
6. Run the project

Command to run project:
	npm start
		- compiles project, runs project.
	npm run-script compile
		- compiles the project per your enviroment settings.
	npm run-script deploy
		- deploys the project, compiles the project for production, then uploads it to the s3 bucket defined in your config.json file. Ensure your set your .env file with the the desired enviroment setting.




