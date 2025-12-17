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

Commands

npm i #install packages

npm start #start server

npm test -- --coverage #run test
