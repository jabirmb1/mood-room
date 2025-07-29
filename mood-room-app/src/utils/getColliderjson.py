import bpy
import json
import bmesh
from mathutils import Vector

# This is a blender script.
# This file will be used to grab gltf files and extract their necessary collider data so that it
# can be used to dynamically create the colliders with rapier (this file will not be called during run time
# it is used on all new model files to generate their colliders

# This function will check if the mesh is a box, sphere or capsule via its name.
def determine_shape(obj_name):
    lname = obj_name.lower()  # lowercase name
    if "sphere" in lname:
        return "sphere"
    elif "capsule" in lname:
        return "capsule"
    else:
        return "box"  # default fallback

# This function will be used to grab the dimensions and convert them into rapier standard depending on shape so our
# rapier can use it directly without any converting:
# Format dimensions according to shape
def get_collider_dimensions(obj, shape):
    dims = obj.dimensions
    if shape == "box":
        # Rapier takes half extents, so divide by 2
        return [dims.x / 2, dims.y / 2, dims.z / 2]
    
    elif shape == "sphere":
        # Take average radius from dimensions
        radius = sum([dims.x, dims.y, dims.z]) / 6  # average diameter / 2
        return [radius]
    
    elif shape == "capsule":
        # Capsule in Rapier takes: [half height (Y axis), radius]
        radius = (dims.x + dims.z) / 4  # average X/Z diameter / 2
        half_height = (dims.y / 2) - radius  # exclude caps from full height
        return [half_height, radius]
    
    return []

# Calculate the center of all mesh objects (so that the colliders will link up to our original models, same logic
# as centerPivot() from our object3d.ts)
def calculate_scene_center():
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    
    if not mesh_objects:
        return Vector((0, 0, 0))
    
    # Calculate bounding box of all mesh objects
    min_coords = Vector((float('inf'), float('inf'), float('inf')))
    max_coords = Vector((float('-inf'), float('-inf'), float('-inf')))
    
    for obj in mesh_objects:
        # Get world space bounding box corners
        bbox_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
        
        for corner in bbox_corners:
            min_coords.x = min(min_coords.x, corner.x)
            min_coords.y = min(min_coords.y, corner.y)
            min_coords.z = min(min_coords.z, corner.z)
            
            max_coords.x = max(max_coords.x, corner.x)
            max_coords.y = max(max_coords.y, corner.y)
            max_coords.z = max(max_coords.z, corner.z)
    
    # Calculate center
    center = (min_coords + max_coords) / 2
    return center

# This function will be used to get the rotations, pos and name of each mesh and put them in a giant array
def export_mesh_transform_data():
    # Calculate the center offset that will be applied to the visual model
    scene_center = calculate_scene_center()
    print(f"Scene center: {scene_center}")
    
    mesh_data = []
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            shape = determine_shape(obj.name)
            
            # Apply the same centering offset that will be applied to the visual model
            centered_position = [
                obj.location.x - scene_center.x,
                obj.location.y - scene_center.y,
                obj.location.z - scene_center.z
            ]
            
            data = {
                "shape": shape,
                "position": centered_position,
                "rotation": [obj.rotation_euler.x, obj.rotation_euler.y, obj.rotation_euler.z],  # euler
                "dimensions": get_collider_dimensions(obj, shape)
            }
            mesh_data.append(data)
            print(json.dumps(data, indent=4))
    
    return mesh_data

# Call the function
exported_data = export_mesh_transform_data()

# Write to a JSON file on disk
output_path = bpy.path.abspath("//colliders.json")  # saves in same folder as .blend file
with open(output_path, 'w') as f:
    json.dump(exported_data, f, indent=4)
    
print(f"Colliders exported to: {output_path}")