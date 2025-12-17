**GET STARTED**
#
create a .env file in the outermost catalog and enter the following

*NOTE! WITHOUT THE SERCET KEYS THE SERVER WILL NOT WORK!*

Email me at mans16160@gmail.com and I will send them.

This is to prevent them getting in the wrong hands.

I only share them with legit, trusted people like employers.

.ENV FOR SIGGEM-SERVER
HTTPS_PORT=443
HTTP_PORT=80
KEYCLOAK_URL=__REPLACE_ME__
KEYCLOAK_REALM=__REPLACE_ME__
CLIENT_SECRET=__REPLACE_ME__
CLIENT_ID=__REPLACE_ME__
MAIL_CLIENT_ID=__REPLACE_ME__
MAIL_CLIENT_SECRET=__REPLACE_ME__
REDIRECT_URI=__REPLACE_ME__
SMTP_USER=__REPLACE_ME__
SMTP_PASS=__REPLACE_ME__
DB_USER=__REPLACE_ME__
DB_HOST=__REPLACE_ME__
DB_NAME=__REPLACE_ME__
DB_PASS=__REPLACE_ME__
DB_PORT=__REPLACE_ME__
CORS_ORIGIN=https://new-image-flow.d67rm4tc97nnq.amplifyapp.com
CORS_ORIGIN_LOCAL=http://localhost:3000
CORS_ORIGIN_NEW=https://zenon-siggem.com
DISABLE_ADMIN_CHECK=true
DISABLE_VERIFY_TOKEN=true
DISABLE_KEYCLOAK_PROTECTION=true
REPORT_TIME=23:59
S3_BUCKET=siggepdfbucket
AWS_SECRET_ACCESS_KEY=__REPLACE_ME__
AWS_ACCESS_KEY_ID=__REPLACE_ME__
AWS_REGION=eu-north-1
SESSION_SECRET=__REPLACE_ME__
IMGUR_CLIENT=__REPLACE_ME__
OPENAI_API_KEY=__REPLACE_ME__
NODE_ENV=production


The reason I have hidden them is because I don't want to share the publicly and risk them getting in the wrong hands

npm i #install packages

npm start #start server

npm test -- --coverage #run test

**ENDPOINTS**
#
GET /company
GET /company/{id}
POST /company, body: {company_name:{name of company}}
PUT /company/{id}, body: {company_name:{name of company}}
DELETE /company/{id}

GET /cost-center
GET /cost-center/{id}
POST /cost_center, body: {cost_center_number:{number of cost_center}, cost_center_name:{name of cost_center}}
PUT /cost_center/{id}, body: {cost_center_number:{number of cost_center}, cost_center_name:{name of cost_center}}
DELETE /cost_center/{id}

GET /user
GET /user/{id}
POST /user, body: {first_name:{first name}, surname:{surname}, email:{email adress}, company_id:{id of company}, cost_center_id:{id of cost_center}, password:{user password} }
PUT /user/{id}, body: {first_name:{first name}, surname:{surname}, email:{email adress}, company_id:{id of company}, cost_center_id:{id of cost_center}, password:{user password} }
DELETE /user/{id}

GET /receipt
GET /receipt/{id}
GET /receipt/user/{user_id} #get all receipts by a specific user
POST /receipt, body: {creation_date:{YYYY-DD-MM}, receipt_date:{YYYY-DD-MM}, user_id:{id of the user}, company_card:{boolean}, tax:{amount of tax}, net:{net value }, image_link:{link to image}, description:{description of the receipt}, charged_comapnies:{array with the chagred companies}, charged_comapnies:{array with the represented}}
PUT /receipt/{id}, body: {creation_date:{YYYY-DD-MM}, receipt_date:{YYYY-DD-MM}, user_id:{id of the user}, company_card:{boolean}, tax:{amount of tax}, net:{net value }, image_link:{link to image}, description:{description of the receipt}, charged_comapnies:{array with the chagred companies}, charged_comapnies:{array with the represented}}
DELETE /receipt/{id}

