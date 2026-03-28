from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import bcrypt
from bson import ObjectId
from datetime import datetime

app = Flask(__name__)
CORS(app) 

# MongoDB connection
client = MongoClient("mongodb://127.0.0.1:27017/")
db = client["upskillDB"]
users_col = db["users"]
exchange_requests_col = db["exchange_requests"]

@app.route("/")
def home():
    return "Upskill API is running !!"

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if users_col.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    username = email.split("@")[0]

    user_data = {
        "name": name,
        "username": username,
        "email": email,
        "password": hashed_pw.decode('utf-8'),
        "credits": 5,
        "title": "",
        "bio": "",
        "location": "",
        "profile_photo": None,
        "skills_offered": [],
        "skills_wanted": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": None
    }

    users_col.insert_one(user_data)

    return jsonify({
        "message": "User registered successfully",
        "credits": 5
    }), 201


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    user = users_col.find_one({"email": email})

    if not user:
        return jsonify({"error": "Email not found"}), 404

    if bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):

        # ✅ Update last login
        users_col.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )

        return jsonify({
            "message": "Login successful",
            "id": str(user["_id"]),
            "name": user["name"],
            "username": user.get("username"),
            "email": user["email"],
            "credits": user["credits"],
            "skills_offered": user.get("skills_offered", []),
            "skills_wanted": user.get("skills_wanted", [])
        }), 200
    else:
        return jsonify({"error": "Incorrect password"}), 401
    
@app.route("/get-user/<email>", methods=["GET"])
def get_user(email):
    user = users_col.find_one({"email": email})

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": str(user["_id"]),
        "name": user["name"],
        "username": user.get("username"),
        "email": user["email"],
        "credits": user["credits"],
        "title": user.get("title", ""),
        "bio": user.get("bio", ""),
        "location": user.get("location", ""),
        "skills_offered": user.get("skills_offered", []),
        "skills_wanted": user.get("skills_wanted", []),
        "created_at": user.get("created_at")
    }), 200




# ===== ACCEPT REQUEST =====
@app.route("/accept-request", methods=["POST"])
def accept_request():
    data = request.get_json()
    request_id = data.get("request_id")
    current_user_id = data.get("current_user_id")

    req = exchange_requests_col.find_one({"_id": ObjectId(request_id)})

    if not req:
        return jsonify({"error": "Request not found"}), 404

    #  Authorization check
    if str(req["to_user_id"]) != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403

    if req["status"] != "pending":
        return jsonify({"error": "Already processed"}), 400

    #  Teacher earns 1 credit
    users_col.update_one(
        {"_id": req["to_user_id"]},
        {"$inc": {"credits": 1}}
    )

    exchange_requests_col.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "status": "accepted",
                "updated_at": datetime.utcnow(),
                "accepted_at": datetime.utcnow()
            }
        }
    )

    return jsonify({"message": "Request accepted"}), 200

# ===== GET RECEIVED + SENT REQUESTS =====
@app.route("/my-requests/<email>", methods=["GET"])
def get_my_requests(email):

    user = users_col.find_one({"email": email})

    if not user:
        return jsonify({"error": "User not found"}), 404

    user_id = user["_id"]

    received = list(exchange_requests_col.find({"to_user_id": user_id}))
    sent = list(exchange_requests_col.find({"from_user_id": user_id}))

    def format_request(req):
        from_user = users_col.find_one({"_id": req["from_user_id"]})
        to_user = users_col.find_one({"_id": req["to_user_id"]})

        return {
            "id": str(req["_id"]),
            "from_user_id":str(req["from_user_id"]) ,
            "to_user_id": str(req["to_user_id"]),
            "from_name": from_user["name"] if from_user else "",
            "to_name": to_user["name"] if to_user else "",
            "skill": req["skill"],
            "status": req["status"],
            "created_at": req.get("created_at")
        }

    return jsonify({
        "received": [format_request(r) for r in received],
        "sent": [format_request(r) for r in sent]
    }), 200


@app.route("/reject-request", methods=["POST"])
def reject_request():
    data = request.get_json()
    request_id = data.get("request_id")
    current_user_id = data.get("current_user_id")

    req = exchange_requests_col.find_one({"_id": ObjectId(request_id)})

    if not req:
        return jsonify({"error": "Request not found"}), 404

    #  Authorization check
    if str(req["to_user_id"]) != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403

    if req["status"] != "pending":
        return jsonify({"error": "Already processed"}), 400

    #  Refund learner
    users_col.update_one(
        {"_id": req["from_user_id"]},
        {"$inc": {"credits": 1}}
    )

    exchange_requests_col.update_one(
        {"_id": ObjectId(request_id)},
        {
            "$set": {
                "status": "rejected",
                "updated_at": datetime.utcnow()
            }
        }
    )

    return jsonify({"message": "Request rejected"}), 200

@app.route("/all-users", methods=["GET"])
def get_all_users():
    users = list(users_col.find())

    result = []

    for user in users:
        # Only show users who offer at least 1 skill
        if not user.get("skills_offered"):
            continue

        result.append({
    "id": str(user["_id"]),
    "name": user["name"],
    "username": user.get("username"),
    "email": user.get("email"),
    "title": user.get("title", ""),
    "credits": user.get("credits", 0),
    "skills_offered": user.get("skills_offered", [])
})

    return jsonify(result), 200

@app.route("/create-request", methods=["POST"])
def create_request():
    data = request.get_json()

    from_user_id = ObjectId(data.get("from_user_id"))
    to_user_id = ObjectId(data.get("to_user_id"))
    skill = data.get("skill")
    skill_category = data.get("skill_category")
    message = data.get("message")

    if from_user_id == to_user_id:
        return jsonify({"error": "You cannot request yourself"}), 400

    learner = users_col.find_one({"_id": from_user_id})

    if learner["credits"] <= 0:
        return jsonify({"error": "Insufficient credits"}), 400

    # Prevent duplicate pending/accepted
    existing = exchange_requests_col.find_one({
        "from_user_id": from_user_id,
        "to_user_id": to_user_id,
        "skill": skill,
        "status": {"$in": ["pending", "accepted"]}
    })

    if existing:
        return jsonify({"error": "Request already exists"}), 400

    #  Deduct immediately
    users_col.update_one(
        {"_id": from_user_id},
        {"$inc": {"credits": -1}}
    )

    new_request = {
        "from_user_id": from_user_id,
        "to_user_id": to_user_id,
        "skill": skill,
        "skill_category": skill_category,
        "message": message,
        "credits": 1,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "accepted_at": None
    }

    exchange_requests_col.insert_one(new_request)

    return jsonify({"message": "Request created"}), 201

@app.route("/user/<user_id>", methods=["GET"])
def get_user_by_id(user_id):

    try:
        user = users_col.find_one({"_id": ObjectId(user_id)})
    except:
        return jsonify({"error": "Invalid ID"}), 400

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": str(user["_id"]),
        "name": user["name"],
        "username": user.get("username"),
        "title": user.get("title", ""),
        "bio": user.get("bio", ""),
        "location": user.get("location", ""),
        "credits": user["credits"],
        "skills_offered": user.get("skills_offered", []),
        "created_at": user.get("created_at")
    }), 200


@app.route("/update-profile/<user_id>", methods=["PUT"])
def update_profile(user_id):

    data = request.get_json()

    allowed_fields = [
        "name",
        "title",
        "location",
        "bio",
        "skills_offered",
        "skills_wanted"
    ]

    update_data = {key: data[key] for key in data if key in allowed_fields}

    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )

    return jsonify({"message": "Profile updated"}), 200

@app.route("/update-email/<user_id>", methods=["PUT"])
def update_email(user_id):

    data = request.get_json()
    new_email = data.get("email")

    # Check if email already exists
    if users_col.find_one({"email": new_email}):
        return jsonify({"error": "Email already in use"}), 400

    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"email": new_email}}
    )

    return jsonify({"message": "Email updated"}), 200



@app.route("/change-password/<user_id>", methods=["PUT"])
def change_password(user_id):

    data = request.get_json()
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    user = users_col.find_one({"_id": ObjectId(user_id)})

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Verify current password
    if not bcrypt.checkpw(current_password.encode('utf-8'),
                          user["password"].encode('utf-8')):
        return jsonify({"error": "Current password incorrect"}), 400

    # Hash new password
    hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'),
                              bcrypt.gensalt())

    users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": hashed_pw.decode('utf-8')}}
    )

    return jsonify({"message": "Password updated"}), 200

if __name__ == "__main__":
    app.run(debug=True)
    
