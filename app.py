from flask import Flask
from flask import render_template

from pymongo import MongoClient
import json
from bson import json_util
from bson.json_util import dumps

app = Flask(__name__)

mongodb_host    = 'localhost'
mongodb_port    = 27017
dbs_name        = 'datathon'
collection_name = 'apd'

fields = {

    # "hospitalclassificationid": True,
    # "icu_ad_dtm": True,
    "icu_ds_dtm": True,
    "age": True,
    "sex": True,
    "hospitalclassification": True,

    "icu_hrs": True,    
    "icu_srce": True,
    "icu_outcm": True,

    "hosp_srce": True,
    "hosp_outcm": True,

    "died_icu": True,
    "_id": False
}



@app.route("/")
def index():
    return render_template("index.html")

@app.route("/apd/icu")
def donorschoose_projects():
    connection = MongoClient(mongodb_host, mongodb_port)
    collection = connection[dbs_name][collection_name]
    projects = collection.find(
            {'icuadmityyyy': {'$gte' :2006, '$lte' : 2016 },
            'age': {'$gte': 80},
            "icu_ds_dtm":{"$exists": True, "$ne": ""} },
            fields,
            # fields,
            limit = 3000
        )
    # 
    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects, default=json_util.default)
    connection.close()
    return json_projects

if __name__ == '__main__':
    app.run(host = '0.0.0.0', port = 5000, debug = True)