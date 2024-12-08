use wasm_bindgen::prelude::wasm_bindgen;
use num_complex::Complex;

fn mandelbrot_pixel(c: Complex<f64>, max_iter: u32) -> u32 {
  let mut z = Complex { re: 0.0, im: 0.0 };
  for i in 0..max_iter {
    if z.re * z.re + z.im * z.im > 4.0 {
      return i;
    }

    z = z * z + c;
  }

  max_iter
}

#[wasm_bindgen(js_name = renderMandelbrot)]
pub fn render_mandelbrot(
  width: u32, height: u32, max_iter: u32,
  start_x: f64, finish_x: f64, start_y: f64,
) -> Vec<u8> {
  let mut img_buffer = vec![0; (width * height * 4) as usize];

  let mut color_index = 0;
  let mut cx = start_x;
  let mut cy = start_y;
  let delta = (finish_x - start_x) / width as f64;

  for x in 0..width {
    for y in 0..height {
      let color_value = mandelbrot_pixel(Complex { re: cx, im: cy }, max_iter);

      let color = if color_value == max_iter {
        [0, 0, 0, 255]
      } else {
        [color_value as u8 * 7, color_value as u8 * 3, color_value as u8 * 5, 255]
      };

      img_buffer[color_index] = color[0];
      img_buffer[color_index + 1] = color[1];
      img_buffer[color_index + 2] = color[2];
      img_buffer[color_index + 3] = color[3];

      color_index += width as usize * 4;
      cy += delta;
    }

    cx += delta;
    cy = start_y;
    color_index = x as usize * 4;
  }

  img_buffer
}