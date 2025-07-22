
use std::{
    fmt, fs, io::{prelude::*, BufReader}, net::{TcpListener, TcpStream}
};

use hello::ThreadPool;

const STATUS_OK: &str = "HTTP/1.1 200 OK";
const STATUS_404: &str = "HTTP/1.1 404 NOT FOUND";

const GREEN:  &str = "\x1b[32m";
const YELLOW: &str = "\x1b[33m";
const RED:    &str = "\x1b[31m";
const RESET:  &str = "\x1b[0m";

const SQUEL_PATH: &str = "../../Squel/build/squel";


macro_rules! DELIMITER {() => {
    ";;."
};}

#[derive(Debug)]
enum DatabaseError {
    CommandFailed(String),
    QueryError(String)
}

impl fmt::Display for DatabaseError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            DatabaseError::CommandFailed(msg) => write!(f, "CommandFailed: {}", msg),
            DatabaseError::QueryError(msg)    => write!(f, "QueryError: {}", msg),
        }
    }
}




fn init_squel_tables() -> Result<(), String>{

    let emails_query = "SELECT * FROM emails;";

    let mut result_msg:          String = "".to_string();
    let mut err_msg:             String = "".to_string();
    let mut emails_table_exists: bool;

    match query_database(emails_query) {
        Ok(msg) => { emails_table_exists = true;
                             result_msg = msg;         }
        Err(DatabaseError::CommandFailed(msg))  => return Err(format!("Failed to run starting email query: {msg}")),
        Err(DatabaseError::QueryError(msg))     => { err_msg = msg;
                                                             emails_table_exists = false; }
    };

    if !emails_table_exists {
        println!("SQL Error:\n  {}", err_msg.trim().replace('\n', "\n  "));
        println!("Creating emails table...");

        let create_emails_table_query: &'static str =   concat!("CREATE TABLE emails (
                                                            id INT AUTO_INCREMENT,
                                                            username VARCHAR(16),
                                                            sender VARCHAR(16),
                                                            title VARCHAR(16),
                                                            body VARCHAR(500),
                                                            hash INT HASH(body),
                                                            time_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                            PRIMARY_KEY(id),
                                                            CONSTRAINT UNIQUE(username, sender, hash) IGNORE,
                                                            DELIMITER(\"", DELIMITER!(), "\")
                                                        );");


        match query_database(&create_emails_table_query) {
            Ok(_) => emails_table_exists = true,
            Err(DatabaseError::CommandFailed(msg))  => return Err(format!("Failed to run create emails query: {msg}")),
            Err(DatabaseError::QueryError(msg))     => { err_msg = msg;
                                                                 emails_table_exists = false }
        };

        if !emails_table_exists {
            // eprintln!("SQL Cout:\n  {}{}{}", YELLOW, String::from_utf8_lossy(&output.stdout).trim().replace('\n', "\n  "), RESET);
            eprintln!("SQL Error:\n  {}{}{}", RED, err_msg.trim().replace('\n', "\n  "), RESET);
            panic!("{}Failed to create emails table{}", RED, RESET); 
        } else {
            println!("{}Emails table created.{}", GREEN, RESET);
        }
    } else {
        println!("{}Result:\n{}{}", GREEN, result_msg, RESET);
    }
    
    // DEBUG
    // println!("Paused...");
    // let mut input = String::new();
    // std::io::stdin().read_line(&mut input).expect("Failed to read line");
    
    let votes_query = "SELECT * FROM votes;";

    let mut votes_table_exists: bool;

    match query_database(&votes_query) {
        Ok(msg) => { votes_table_exists = true;
                             result_msg = msg;         }
        Err(DatabaseError::CommandFailed(msg))  => return Err(format!("Failed to run starting vote query: {msg}")),
        Err(DatabaseError::QueryError(msg))     => { err_msg = msg;
                                                             votes_table_exists = false; }
    };

    if !votes_table_exists {
        println!("SQL Error:\n  {}", err_msg.trim().replace('\n', "\n  "));
        println!("Creating votes table...");

        let create_votes_table_query: &'static str =   concat!("CREATE TABLE votes (
                                                            username VARCHAR(16),
                                                            email_id INT FOREIGN_KEY REFERENCES emails.id,
                                                            time_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                            CONSTRAINT UNIQUE(username, email_id) IGNORE,
                                                            DELIMITER(\"", DELIMITER!(), "\")
                                                        );");

        match query_database(&create_votes_table_query) {
            Ok(_) => votes_table_exists = true,
            Err(DatabaseError::CommandFailed(msg))  => return Err(format!("Failed to run create votes query: {msg}")),
            Err(DatabaseError::QueryError(msg))     => { err_msg = msg;
                                                                 votes_table_exists = false }
        };

        if !votes_table_exists {
            eprintln!("SQL Error:\n  {}{}{}", RED, err_msg.trim().replace('\n', "\n  "), RESET);
            panic!("{}Failed to create votes table{}", RED, RESET); 
        } else {
            println!("{}Votes table created.{}", GREEN, RESET);
        }
    } else {
        println!("{}Result:\n{}{}", GREEN, result_msg, RESET);
    }

    Ok(())
}

use std::os::unix::net::UnixStream;
use std::io::{Read, Write};

const SOCKET_PATH: &str = "/tmp/squel_daemon.sock";

fn launch_squel_daemon() {

    let output = Command::new(SQUEL_PATH)
        .args(["-b"])
        .output()
        .unwrap_or_else(|e| panic!("{}Failed to run Squel daemon: {}{}", RED, e, RESET));

    if !output.status.success() {
        println!("{}launch_squel_daemon(): Squel daemon is already running", RESET); 
    } else {
        println!("{}launch_squel_daemon(): Squel daemon launched", RESET);
    }
}

fn main() {
 
    let daemon_thread = ThreadPool::new(1);
    daemon_thread.execute(|| {
        launch_squel_daemon();
    });

    let mut loop_count = 0;
    let max_loops = 10;
    while let Err(e) = init_squel_tables() {
        println!("{}", e);
        loop_count += 1;
        if loop_count >= max_loops {
            break;
        }
    }

    if loop_count == max_loops {
        panic!("Failed to initialize tables"); }

    let address_and_port = "127.0.0.1:7878";
    let listener = TcpListener::bind(address_and_port).unwrap();
    println!("Bound to port {}", address_and_port);

    let pool = ThreadPool::new(4);

    println!("Listening...");
    for stream in listener.incoming() {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }

    println!("Shutting down server....");
}

fn get_404() -> (&'static str, String) {
    let status_line = "HTTP/1.1 404 NOT FOUND";
    let file_name = "../public/404.html".to_string();
    (status_line, file_name)
}

use std::process::Command;

fn construct_username_query(path: &str) -> Result<String, String> {
    let path_parts: Vec<&str> = path.trim().split("/").filter(|s| !s.is_empty()).collect();
    if path_parts.len() != 3 {
        return Err("Query failed to be constructed".into()); }

    let username = path_parts[1];

    let content_type = path_parts[2];

    // Idk if I like the '=' for comparison, might change it to '=='
    Ok(format!("SELECT * FROM {} WHERE username == {};", content_type, username))
}

fn send_username_query(filename: &str) -> Result<String, String> {
    let query = construct_username_query(filename)?;

    match query_database(&query) {
        Ok(msg) => Ok(msg),
        Err(DatabaseError::CommandFailed(msg)) => Err(format!("Failed to run send_username_query(): {msg}")),
        Err(DatabaseError::QueryError(msg))    => Err(format!("Failed to run send_username_query(): {msg}"))
    }

}



fn query_database(query: &str) -> Result<String, DatabaseError> {

    println!("Debug - Query:\n'{}'", query);
    println!("Debug - Attempting to connect to {}", SOCKET_PATH);
    let mut stream = UnixStream::connect(SOCKET_PATH)
    .map_err(|e| match e.raw_os_error() {
        Some(2) => DatabaseError::CommandFailed(format!(
            "{}Error: Failed to connect to Squel daemon on '{}', (code {}) - {}. (Is daemon running?){}", RED, SOCKET_PATH, 2, e, RESET)),
        Some(code) => DatabaseError::CommandFailed(format!(
            "{}Error: Failed to connect to Squel daemon on '{}', (code {}) - {}{}", RED, SOCKET_PATH, code, e, RESET)),
        None => DatabaseError::CommandFailed(format!(
            "{}Error: Failed to connect to Squel daemon on '{}', (no code) - {}{}", RED, SOCKET_PATH, e, RESET)),
    })?;

    println!("Debug - Connected successfully");
    
    // Send command
    let formatted_query = format!("-q {}", query);
    println!("Debug - Sending query: '{}'", formatted_query);
    stream.write_all(formatted_query.as_bytes()).map_err(|e| DatabaseError::CommandFailed(format!("{}Error: Failed to send query, {e}{}", RED, RESET)))?;

    stream.shutdown(std::net::Shutdown::Write).map_err(|e| DatabaseError::CommandFailed(format!("{}Error: Connection failed to cloes, {e}{}", RED, RESET)))?;
    
    println!("Debug - Query sent, waiting for response...");

    // Read response
    let mut response = String::new();
    let mut buffer = [0; 1024];
    loop {
        match stream.read(&mut buffer) {
            Ok(0) => break, // Connection closed
            Ok(n) => {
                response.push_str(&String::from_utf8_lossy(&buffer[..n]));
            }
            Err(e) => return Err(DatabaseError::CommandFailed(format!("{}Error: Failed to get query response, {e}{}", RED, RESET))),
        }
    }
    
    println!("Debug - Full response received: '{}'", response);

    if !response.starts_with("SUCCESS:") {
        return Err(DatabaseError::QueryError(response)); }
    
    Ok(response)

}

fn handle_user_request(path_parts: Vec<&str> ) -> (&'static str, String) {

    print!("handle_user_request(");
    for part in &path_parts {
        print!("{part}"); }
    println!(")");

    if path_parts[0].trim() != "users" {
        panic!();
    }

    let username = if let Some(name) = path_parts.get(1) {
        *name
    } else {
        return (STATUS_404, "../public/404.html".to_string());
    };

    let content_type = if let Some(ct) = path_parts.get(2) {
        *ct
    } else {
        return (STATUS_404, "../public/404.html".to_string());
    };

    (STATUS_OK, format!("/users/{}/{}", username, content_type))
}

fn handle_get(request_parts: &[&str]) -> (&'static str, String) {

    if request_parts[0].trim() != "GET" {
        panic!("handle_get() called without GET");
    };
    


    println!("Debug - request path: '{}'", request_parts[1]);
    
    let first_part = request_parts[1].trim().split("/").find(|s| !s.is_empty());

    println!("Debug - first part: '{:?}'", first_part);

    let (status_line, filename) = match first_part {
        None => (STATUS_OK, "../public/index.html".to_string()),
        Some(x) => match x {
            "styles.css"  => (STATUS_OK, "../public/styles.css".to_string()),
            "script.js"   => (STATUS_OK, "../public/script.js".to_string()),
            "favicon.ico" => (STATUS_OK, "../public/favicon.ico".to_string()),
            "users" => { 
                let path_parts: Vec<&str> = request_parts[1].trim().split("/").filter(|s| !s.is_empty()).collect();
                handle_user_request(path_parts)
            },
            _ => (STATUS_404, "../public/404.html".to_string())
        }
    };



    let mut content: String;
    let first_part = request_parts[1].trim().split("/").find(|s| !s.is_empty()); 
    if first_part == Some("users") && status_line != STATUS_404 {
        match send_username_query(&filename) {
            Ok(query_result)  => return (STATUS_OK, query_result),
            Err(query_result) => return (STATUS_404, query_result)
        }
    } else {
        content = fs::read_to_string(&filename).unwrap_or_else(|e| {
            eprintln!("Error reading file ({}), status ({}), error: {}", filename, status_line, e);
            String::new()
        });
    }
    

    if status_line == STATUS_404 {
        content += &format!("\n<div>{} does not exist</div>", request_parts[1]);
        content += "\n</html>";
        println!("Sending 404, {}: {} does not exist", request_parts[0], request_parts[1]);
    }
    
    (status_line, content)
}

fn handle_post(request_parts: &[&str], body: &str, boundary: &str) -> (&'static str, String) {

    if request_parts[0].trim() != "POST" {
        panic!("handle_post() called without POST"); }

    print!("handle_post(");
    for part in request_parts {
        print!("{part}"); }
    println!(")"); 

    println!("Debug - request path: '{}'", request_parts[1]);
    
    let request_path = request_parts[1];
    match request_path {
        "/" => (),
        _   => return (STATUS_404, "Malformed request path".to_string()),
    }

    // Get items
    let post_items = ["username", "recipient", "title", "composeText"];
    let mut given_items = [""; 4];
    let sections: Vec<&str> = body.split(boundary).collect();
    if sections.len() != 6 {
        return (STATUS_404, format!("Contained incorrect number of sections. Expected 6, got {}", sections.len())); }

    let mut sections_iter = sections.into_iter();
    sections_iter.next(); // Skip starting boundary

    for (current_item_index, section) in sections_iter.enumerate() {
        if current_item_index == 4 { // Skip closing boundary
            break;
        }
        
        let current_item = post_items[current_item_index];

        let mut lines = section.split("\r\n");

        lines.next(); // Skip starting whitespace

        // println!("Printing lines...");
        // for line in lines {
        //     println!("{line}");
        // }

        let Some(disposition) = lines.next() else {
            return (STATUS_404, format!("{current_item}: Missing disposition line"));
        };

        println!("Disposition line: {disposition}");

        let Some(name_start) = disposition.find("name=\"") else {
            return (STATUS_404, format!("{current_item}: Disposition line missing 'name=' part"));
        };

        let value_start = name_start + "name=\"".len();
        
        let Some(given_item) = disposition.get(value_start..value_start + current_item.len()) else {
            return (STATUS_404, format!("{current_item}: 'name=' value mismatch length"));
        };

        if current_item != given_item {
            return (STATUS_404, format!("{current_item}: 'name=' value mismatch. Got {given_item}"));
        }

        lines.next(); // skip whitespace

        let Some(name) = lines.next() else {
            return (STATUS_404, format!("{current_item}: Missing withspace after disposition"));
        };

        given_items[current_item_index] = name;
    }

    // To make queries with quotes not die. Add paramterized queries to Squel to get rid of this funkiness. 
    let username  = given_items[0].trim().replace("\\", "\\\\").replace("\"", "\\\"").replace("\'", "\\\'");
    let recipient = given_items[1].trim().replace("\\", "\\\\").replace("\"", "\\\"").replace("\'", "\\\'");
    let title     = given_items[2].trim().replace("\\", "\\\\").replace("\"", "\\\"").replace("\'", "\\\'");
    let body      = given_items[3].replace("\\", "\\\\").replace("\"", "\\\"").replace("\'", "\\\'");

    let insert_query = format!("INSERT INTO emails (username, sender, title, body)\nVALUES(\"{recipient}\", \"{username}\", \"{title}\", \"{body}\");");

    // match query_database(&insert_query) {
    //     Ok(_) => (),
    //     Err(e) => { eprintln!("handle_post() query failed: {e}");
    //                         return (STATUS_404, e); }
    // };

    // (STATUS_OK, "".to_string())

    match query_database(&insert_query) {
        Ok(msg) => (STATUS_OK, msg),
        Err(DatabaseError::CommandFailed(msg)) => (STATUS_404, msg),
        Err(DatabaseError::QueryError(msg))    => (STATUS_404, msg)
    }
}

fn handle_put(request_parts: &[&str], body: &str, boundary: &str) -> (&'static str, String) {

    if request_parts[0].trim() != "PUT" {
        panic!("handle_put() called without PUT"); }

    print!("handle_put(");
    for part in request_parts {
        print!("{part}"); }
    println!(")"); 

    println!("Debug - request path: '{}'", request_parts[1]);
    
    let request_path = request_parts[1];
    match request_path {
        "/" => (),
        _   => return (STATUS_404, "Malformed request path".to_string()),
    }

    // Get items
    let put_items = ["operation", "username", "email_id"];
    let mut given_items = [""; 3];
    let sections: Vec<&str> = body.split(boundary).collect();
    if sections.len() != 5 {
        return (STATUS_404, format!("Contained incorrect number of sections. Expected 5, got {}", sections.len())); }

    let mut sections_iter = sections.into_iter();
    sections_iter.next(); // Skip starting boundary

    for (current_item_index, section) in sections_iter.enumerate() {
        if current_item_index == 3 { // Skip closing boundary
            break;
        }
        
        let current_item = put_items[current_item_index];

        let mut lines = section.split("\r\n");

        lines.next(); // Skip starting whitespace

        // println!("Printing lines...");
        // for line in lines {
        //     println!("{line}");
        // }

        let Some(disposition) = lines.next() else {
            return (STATUS_404, format!("{current_item}: Missing disposition line"));
        };

        println!("Disposition line: {disposition}");

        let Some(name_start) = disposition.find("name=\"") else {
            return (STATUS_404, format!("{current_item}: Disposition line missing 'name=' part"));
        };

        let value_start = name_start + "name=\"".len();
        
        let Some(given_item) = disposition.get(value_start..value_start + current_item.len()) else {
            return (STATUS_404, format!("{current_item}: 'name=' value mismatch length"));
        };

        if current_item != given_item {
            return (STATUS_404, format!("{current_item}: 'name=' value mismatch. Got {given_item}"));
        }

        lines.next(); // skip whitespace

        let Some(name) = lines.next() else {
            return (STATUS_404, format!("{current_item}: Missing withspace after disposition"));
        };

        given_items[current_item_index] = name;
    }

    match given_items[0] {
        "INSERT INTO" => (),
        "DELETE" => (),
        _        => { return (STATUS_404, format!("Invalid vote operation {}", given_items[0])); }
    }

    // To make queries with quotes not die. Add paramterized queries to Squel to get rid of this funkiness. 
    let operation  = given_items[0];
    let username = given_items[1].trim().replace("\\", "\\\\").replace("\"", "\\\"").replace("\'", "\\\'");
    let email_id     = given_items[2].replace("\\", "\\\\").replace("\"", "\\\"").replace("\'", "\\\'");

    let vote_query = match operation {
        "INSERT INTO" => format!("INSERT INTO votes (username, email_id)\nVALUES(\"{username}\", {email_id});"),
        "DELETE"      => format!("DELETE FROM votes WHERE username == \"{username}\" AND email_id == {email_id});"),
        _             => panic!("handle_put(): Bad operator, shouldn't happen")
    };

    match query_database(&vote_query) {
        Ok(msg) => (STATUS_OK, msg),
        Err(DatabaseError::CommandFailed(msg)) => (STATUS_404, msg),
        Err(DatabaseError::QueryError(msg))    => (STATUS_404, msg)
    }
}


fn handle_connection(mut stream: TcpStream) {
    let mut buf_reader = BufReader::new(&stream);
    let mut http_request: Vec<String> = Vec::new();
    let mut line = String::new();
    
    // Read headers line by line
    loop {
        line.clear();
        buf_reader.read_line(&mut line).unwrap();
        if line.trim().is_empty() {
            break; // Empty line indicates end of headers
        }
        http_request.push(line.trim().to_string());
    }
    
    let request_line = http_request[0].clone();
    println!("Request headers: {http_request:#?}");
    
    // Parse Content-Length from headers
    let content_length = http_request
        .iter()
        .find(|header| header.to_lowercase().starts_with("content-length:"))
        .and_then(|header| {
            header.split(':')
                .nth(1)
                .and_then(|len| len.trim().parse::<usize>().ok())
        })
        .unwrap_or(0);
    
    // Read the body if Content-Length > 0
    let mut body = String::new();
    if content_length > 0 {
        let mut body_buffer = vec![0; content_length];
        buf_reader.read_exact(&mut body_buffer).unwrap();
        body = String::from_utf8_lossy(&body_buffer).to_string();
        println!("Request body:\n{}", body);
    }

    // // Get boundary
    let boundary: &str = http_request
        .iter()
        .find(|header| header.starts_with("Content-Type:"))
        .and_then(|header| {
            header.split("boundary=")
                .nth(1)
        })
        .unwrap_or("Couldn't get boundary");

    println!("Request boundary: {}", boundary);

    println!("Request: {http_request:#?}");

    let request_parts: Vec<&str> = request_line.split_whitespace().collect();



    let (status_line, content) = match request_parts[0].trim() {
        "GET"  => handle_get (&request_parts),
        "POST" => handle_post(&request_parts, &body, boundary),
        "PUT"  => handle_put(&request_parts, &body, boundary),
        _      => get_404()
    };

    let length = content.len();    
    
    let response = format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{content}");

    println!("Sending:\n'{response}'\n");
    let mut retries = 0;
    loop {
    match stream.write_all(response.as_bytes()) {
        Ok(_) => break,
        Err(e) => {
            retries += 1;
            if retries >= 3 {
                panic!("bruh: failed to write after 3 tries: {e}");
            }
        }
    }
    }

}