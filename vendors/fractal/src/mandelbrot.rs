use wasm_bindgen::prelude::wasm_bindgen;
use num_complex::Complex;

fn mandelbrot_pixel(c: Complex<f64>, max_iter: u32) -> u32 {
  let mut z = Complex { re: 0.0, im: 0.0 };
  for i in 0..max_iter {
    if z.norm() > 2.0 {
      return i;
    }
    z = z * z + c;
  }
  return max_iter;
}

#[wasm_bindgen(js_name = renderMandelbrot)]
pub fn render_mandelbrot(width: u32, height: u32, zoom: f64, new_param_x: f64, new_param_y: f64) -> Vec<u8> {
  let max_iter = 256;
  let mut img_buffer = vec![0; (width * height * 4) as usize];

  let center_x = -0.34; // Центр фрактала остается по центру экрана
  let center_y = -0.15; // Центр фрактала остается по центру экрана

  for x in 0..width {
    for y in 0..height {
      let cx = (x as f64 / width as f64  - 0.75) / 0.4;
      let cy = (y as f64 / height as f64 - 0.5) / 0.4;
      let color_index = (y * width + x) as usize * 4;
      let color_value = mandelbrot_pixel(Complex { re: cx, im: cy }, max_iter);

      let color = if color_value == max_iter {
        [0, 0, 0, 255]
      } else {
        [color_value as u8 * 10, 255 - color_value as u8 * 10, color_value as u8 * 5, color_value as u8]
      };

      img_buffer[color_index] = color[0];
      img_buffer[color_index + 1] = color[1];
      img_buffer[color_index + 2] = color[2];
      img_buffer[color_index + 3] = color[3];
    }
  }

  img_buffer
}
