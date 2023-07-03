use std::env;
use std::fs::File;
use std::io::Read;
use std::time::Instant;
use graph_algoritms::solve_traveling_salesman_problem_little;

fn main() -> std::io::Result<()> {
  // Проверка наличия аргументов командной строки
  let args: Vec<String> = env::args().collect();
  if args.len() < 2 {
    eprintln!("Пожалуйста, предоставьте путь к файлу данных как аргумент командной строки.");
    std::process::exit(1);
  }

  let mut file = File::open(&args[1])?;
  let mut data = String::new();
  file.read_to_string(&mut data)?;
  let data: Vec<Vec<u32>> = data
    .lines()
    .map(|line| {
      line.split_whitespace()
        .map(|num_str| {
          let num = num_str.parse().unwrap_or(0);
          if num == 0 { u32::MAX } else { num }
        })
        .collect()
    })
    .collect();
  let start = Instant::now();
  let result = solve_traveling_salesman_problem_little(data);
  let duration = start.elapsed();
  println!("used time [{:?}]", duration);
  if let Some(result) = result {
    println!("path: {:?}", result.path);
    println!("distance: {:#?}", result.distance);
    println!("nodes: {:#?}", result.steps);
  } else {
    println!("Can't find path")
  }

  Ok(())
}
