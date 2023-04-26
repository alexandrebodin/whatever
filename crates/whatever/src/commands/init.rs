use std::fs::File;
use std::io::prelude::*;
use std::path::Path;

pub fn run() {
    println!("Init");

    let path = Path::new(".whateverrc");
    let display = path.display();

    let mut file = match File::create(&path) {
        Err(why) => panic!("couldn't create {}: {}", display, why),
        Ok(file) => file,
    };

    match file.write_all("Hello, world!".as_bytes()) {
        Err(why) => panic!("couldn't write to {}: {}", display, why),
        Ok(_) => println!("successfully wrote to {}", display),
    }
}
