# spritesheet-cleanup
A tool for fixing up sprite sheets with inconsistent frame layouts.

## Live Demo

https://epirito.github.io/spritesheet-cleanup/

## Usage

Click on Choose file and choose a sprite sheet. This tool will detect the frames and outline them with red rectangles. 
It will also generate a new sprite sheet with the frames laid out on a grid, which you can download by right clicking and "saving as."
The (horizontal) position of each frame on the new sheet is estimated by calculating the center of mass of the frame.
By default, it takes the vertical position of each frame at face value, and thus only works with horizontal strips.

![image](https://user-images.githubusercontent.com/96730122/222261856-7ac4709f-d8cd-41a4-b685-791cfe148b1a.png)

## To-do

Add an option to also estimate the vertical position by the center of mass, allowing multiline sheets.
Improve the performance.
