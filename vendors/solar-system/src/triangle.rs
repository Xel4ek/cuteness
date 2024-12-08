use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::wasm_bindgen;
use web_sys::{WebGlProgram, WebGlRenderingContext};
use crate::canvas::init_webgl_context;
use crate::shaders::{setup_shaders, setup_vertices};

#[wasm_bindgen]
pub fn draw_triangle(
    canvas_id: &str,
    selected_color: Option<Vec<f32>>,
) -> Result<WebGlRenderingContext, JsValue> {
    let gl: WebGlRenderingContext = init_webgl_context(canvas_id).unwrap();
    let shader_program: WebGlProgram = setup_shaders(&gl).unwrap();
    let vertices: [f32; 9] = [
        0.0, 1.0, 0.0, // top
        -1.0, -1.0, 0.0, // bottom left
        1.0, -1.0, 0.0, // bottom right
    ];

    setup_vertices(&gl, &vertices, &shader_program);

    let color = selected_color.unwrap_or(vec![1.0, 0.0, 0.0, 1.0]);
    let color_location = gl
        .get_uniform_location(&shader_program, "fragColor")
        .unwrap();
    gl.uniform4fv_with_f32_array(Some(&color_location), &color);

    gl.draw_arrays(
        WebGlRenderingContext::TRIANGLES,
        0,
        (vertices.len() / 3) as i32,
    );

    Ok(gl)
}