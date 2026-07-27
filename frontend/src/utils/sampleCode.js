export const SAMPLE_SNIPPETS = [
  {
    id: "py-sqli-eval",
    name: "Python: SQL Injection & Danger Eval",
    language: "python",
    code: `import sqlite3

AWS_SECRET_KEY = "AKIAIOSFODNN7EXAMPLE123456"

def get_user_data(user_id, format_type="json"):
    # SQL Injection risk
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    cursor.execute(query)
    user = cursor.fetchone()
    
    print(f"Fetched user: {user}")
    
    # Dangerous eval call
    if format_type != "json":
        transformed = eval(f"custom_formatter('{user}')")
    
    return user

def append_logs(log_entry, log_list=[]):
    # Mutable default argument bug
    log_list.append(log_entry)
    return log_list
`
  },
  {
    id: "js-react-bugs",
    name: "JavaScript: React State Mutation & XSS",
    language: "javascript",
    code: `import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  var userState = useState(null); // Legacy var usage
  const [userData, setUserData] = userState;
  
  useEffect(() => {
    // Missing await and missing dependency array
    fetch('/api/user/' + userId)
      .then(res => res.json())
      .then(data => {
        // Direct mutation bug
        data.lastSeen = new Date();
        setUserData(data);
      });
  });

  const handleUpdate = () => {
    // Loose equality check
    if (userData == null) return;
    
    // Direct state property assignment
    userData.role = "admin";
    setUserData(userData);
  };

  return (
    <div>
      {/* XSS Security Vulnerability */}
      <div dangerouslySetInnerHTML={{ __html: userData?.bio }} />
      <button onClick={handleUpdate}>Promote</button>
    </div>
  );
}

export default UserProfile;
`
  },
  {
    id: "py-api-timeout",
    name: "Python: Microservice Request Without Timeout",
    language: "python",
    code: `import requests

def fetch_payment_status(transaction_id):
    try:
        # Missing network timeout parameter can hang worker threads indefinitely
        response = requests.get(f"https://api.payments.com/v1/tx/{transaction_id}")
        data = response.json()
        return data["status"]
    except:
        # Bare except hides connection failures and system signals
        print("Payment API request failed")
        return None
`
  }
];
