import * as pl from './logic.js';

// source for vertex shader
export var vertexShaderText =
[
"precision mediump float;",
"",
"attribute vec2 vertPos;",
"uniform mat4 mvp;",
"uniform vec3 color;",
"varying mediump vec3 col;",
"void main()",
"{",
"col = color;",
"mediump vec4 fPos = vec4(vertPos, 0.0, 1.0);",
"fPos = mvp * fPos;",
"gl_Position = mvp * vec4(vertPos, 0.0, 1.0);",
"}"
].join("\n");

// source for fragment shader
export var fragmentShaderText =
[
"precision mediump float;",
"varying mediump vec3 col;",
"void main()",
"{",
" gl_FragColor = vec4(col, 1.0);",
"}"
].join("\n");

// dot graphic only made once and reused to draw multiple lines
export class circleTemplate {
	vertices;
	indices;
	VAO;
	VBO;
	IBO;
	constructor() {
		this.vertices = [
			0.000000, 0.000000, 0.000000,
			0.951057, 0.309017, 1.000000,
			0.809018, 0.587785, 1.000000,
			0.587786, 0.809018, 1.000000,
			0.309017, 0.951057, 1.000000,
			0.000000, 1.000001, 1.000000,
			-0.309017, 0.951057, 1.000000,
			-0.587785, 0.809017, 1.000000,
			-0.809017, 0.587785, 1.000000,
			-0.951057, 0.309017, 1.000000,
			-1.000000, 0.000000, 1.000000,
			-0.951057, -0.309017, 1.000000,
			-0.809017, -0.587785, 1.000000,
			-0.587785, -0.809017, 1.000000,
			-0.309017, -0.951056, 1.000000,
			-0.000000, -1.000001, 1.000000,
			0.309017, -0.951056, 1.000000,
			0.587785, -0.809017, 1.000000,
			0.809017, -0.587785, 1.000000,
			0.951057, -0.309017, 1.000000,
			1.000000, 0.000000, 1.000000,
			0.000000, 0.000000, 1.000000
		];
		this.indices = [
			1, 2, 21,
			2, 3, 21,
			3, 4, 21,
			4, 5, 21,
			5, 6, 21,
			6, 7, 21,
			7, 8, 21,
			8, 9, 21,
			9, 10, 21,
			10, 11, 21,
			11, 12, 21,
			12, 13, 21,
			13, 14, 21,
			14, 15, 21,
			15, 16, 21,
			16, 17, 21,
			17, 18, 21,
			18, 19, 21,
			19, 20, 21,
			20, 1, 21
		];
		this.VAO = 0;
		this.VBO = 0;
		this.IBO = 0;
	}
};

export class zeroTemplate {
	vertices;
	indices;
	VAO;
	VBO;
	IBO;
	constructor() {
		this.vertices = [
			0, 0, 0,
			-0.043487, 0.375000, 0.000000,
			-0.086209, 0.371017, 0.000000,
			-0.123948, 0.359070, 0.000000,
			-0.156696, 0.339174, 0.000000,
			-0.184452, 0.311304, 0.000000,
			-0.211200, 0.266513, 0.000000,
			-0.230304, 0.209409, 0.000000,
			-0.241774, 0.139983, 0.000000,
			-0.245591, 0.058252, 0.000000,
			-0.242122, -0.024504, 0.000000,
			-0.231687, -0.093591, 0.000000,
			-0.214304, -0.149017, 0.000000,
			-0.189974, -0.190774, 0.000000,
			-0.159957, -0.221330, 0.000000,
			-0.125539, -0.243157, 0.000000,
			-0.086713, -0.256243, 0.000000,
			-0.043487, -0.260609, 0.000000,
			-0.000765, -0.256626, 0.000000,
			0.036974, -0.244696, 0.000000,
			0.069722, -0.224791, 0.000000,
			0.097478, -0.196930, 0.000000,
			0.124226, -0.152087, 0.000000,
			0.143330, -0.094817, 0.000000,
			0.154800, -0.025130, 0.000000,
			0.158617, 0.056974, 0.000000,
			0.154826, 0.139217, 0.000000,
			0.143435, 0.208870, 0.000000,
			0.124461, 0.265957, 0.000000,
			0.097904, 0.310461, 0.000000,
			0.069957, 0.338696, 0.000000,
			0.037078, 0.358861, 0.000000,
			-0.000739, 0.370965, 0.000000,
			-0.043487, 0.274975, 0.000000,
			-0.033018, 0.274110, 0.000000,
			-0.023154, 0.271540, 0.000000,
			-0.013905, 0.267249, 0.000000,
			-0.005253, 0.261244, 0.000000,
			0.002733, 0.252687, 0.000000,
			0.010009, 0.240747, 0.000000,
			0.016568, 0.225433, 0.000000,
			0.022417, 0.206744, 0.000000,
			0.027227, 0.182094, 0.000000,
			0.030654, 0.148913, 0.000000,
			0.032713, 0.107210, 0.000000,
			0.033405, 0.056975, 0.000000,
			0.032635, 0.006438, 0.000000,
			0.030342, -0.036174, 0.000000,
			0.026509, -0.070870, 0.000000,
			0.021153, -0.097648, 0.000000,
			0.016031, -0.114027, 0.000000,
			0.009958, -0.127697, 0.000000,
			0.002932, -0.138642, 0.000000,
			-0.005045, -0.146862, 0.000000,
			-0.013784, -0.152875, 0.000000,
			-0.023102, -0.157166, 0.000000,
			-0.033009, -0.159736, 0.000000,
			-0.043487, -0.160593, 0.000000,
			-0.053956, -0.159753, 0.000000,
			-0.063820, -0.157218, 0.000000,
			-0.073077, -0.152987, 0.000000,
			-0.081721, -0.147078, 0.000000,
			-0.089707, -0.138616, 0.000000,
			-0.096983, -0.126745, 0.000000,
			-0.103542, -0.111466, 0.000000,
			-0.109391, -0.092785, 0.000000,
			-0.114201, -0.068144, 0.000000,
			-0.117627, -0.034963, 0.000000,
			-0.119687, 0.006741, 0.000000,
			-0.120379, 0.056975, 0.000000,
			-0.119609, 0.107538, 0.000000,
			-0.117316, 0.150237, 0.000000,
			-0.113483, 0.185062, 0.000000,
			-0.108127, 0.212022, 0.000000,
			-0.103005, 0.228409, 0.000000,
			-0.096931, 0.242071, 0.000000,
			-0.089906, 0.253016, 0.000000,
			-0.081929, 0.261244, 0.000000,
			-0.073190, 0.267249, 0.000000,
			-0.063871, 0.271540, 0.000000,
			-0.053973, 0.274110, 0.000000
			
		];
		this.indices = [
			1, 2, 32,
			2, 3, 32,
			3, 4, 32,
			4, 5, 32,
			5, 6, 32,
			6, 7, 32,
			32, 7, 31,
			31, 7, 30,
			79, 80, 30,
			30, 7, 79,
			79, 7, 78,
			78, 7, 77,
			80, 33, 30,
			77, 7, 76,
			33, 34, 30,
			76, 7, 75,
			34, 35, 30,
			75, 7, 74,
			35, 36, 30,
			74, 7, 73,
			36, 37, 30,
			73, 7, 72,
			7, 8, 72,
			72, 8, 71,
			71, 8, 70,
			8, 9, 70,
			70, 9, 69,
			9, 10, 69,
			69, 10, 68,
			68, 10, 67,
			10, 11, 67,
			67, 11, 66,
			11, 12, 66,
			66, 12, 65,
			65, 12, 64,
			12, 13, 64,
			64, 13, 63,
			13, 14, 63,
			63, 14, 62,
			14, 15, 62,
			62, 15, 61,
			61, 15, 60,
			15, 16, 60,
			60, 16, 59,
			16, 17, 59,
			59, 17, 58,
			58, 17, 57,
			17, 18, 57,
			57, 18, 56,
			56, 18, 55,
			18, 19, 55,
			55, 19, 54,
			19, 20, 54,
			54, 20, 53,
			20, 21, 53,
			53, 21, 52,
			21, 22, 52,
			52, 22, 51,
			51, 22, 50,
			22, 23, 50,
			50, 23, 49,
			49, 23, 48,
			23, 24, 48,
			48, 24, 47,
			47, 24, 46,
			24, 25, 46,
			46, 25, 45,
			25, 26, 45,
			45, 26, 44,
			44, 26, 43,
			26, 27, 43,
			43, 27, 42,
			27, 28, 42,
			42, 28, 41,
			41, 28, 40,
			28, 29, 40,
			40, 29, 39,
			29, 30, 39,
			39, 30, 38,
			30, 37, 38,
		];
		this.VAO = 0;
		this.VBO = 0;
		this.IBO = 0;
	}
};

export class oneTemplate {
	vertices;
	indices;
	VAO;
	VBO;
	IBO;
	constructor() {
		this.vertices = [
			0, 0, 0,
			0.125500, 0.375000, 0.000000,
			0.028691, 0.375000, 0.000000,
			0.016352, 0.347435, 0.000000,
			-0.000283, 0.321652, 0.000000,
			-0.021222, 0.297652, 0.000000,
			-0.046457, 0.275426, 0.000000,
			-0.073343, 0.255809, 0.000000,
			-0.099213, 0.239600, 0.000000,
			-0.124083, 0.226826, 0.000000,
			-0.147935, 0.217470, 0.000000,
			-0.147935, 0.109200, 0.000000,
			-0.105030, 0.125844, 0.000000,
			-0.065039, 0.146461, 0.000000,
			-0.027961, 0.171061, 0.000000,
			0.006187, 0.199635, 0.000000,
			0.006187, -0.250000, 0.000000,
			0.125500, -0.250000, 0.000000
			
		];
		this.indices = [
			11, 12, 10,
			10, 12, 9,
			12, 13, 9,
			9, 13, 8,
			13, 14, 8,
			8, 14, 7,
			14, 15, 7,
			7, 15, 6,
			1, 2, 17,
			2, 3, 17,
			3, 4, 17,
			16, 17, 15,
			17, 4, 15,
			4, 5, 15,
			5, 6, 15
		];
		this.VAO = 0;
		this.VBO = 0;
		this.IBO = 0;
	}
};

export class twoTemplate {
	vertices;
	indices;
	VAO;
	VBO;
	IBO;
	constructor() {
		this.vertices = [
			0, 0, 0,
			0.033326, 0.312500, 0.000000,
			-0.006952, 0.309813, 0.000000,
			-0.043735, 0.301778, 0.000000,
			-0.077013, 0.288370, 0.000000,
			-0.106787, 0.269613, 0.000000,
			-0.131970, 0.244691, 0.000000,
			-0.151474, 0.212822, 0.000000,
			-0.165300, 0.173996, 0.000000,
			-0.169370, 0.151109, 0.000000,
			-0.173448, 0.128222, 0.000000,
			-0.133822, 0.124256, 0.000000,
			-0.094187, 0.120300, 0.000000,
			-0.054561, 0.116335, 0.000000,
			-0.051691, 0.140587, 0.000000,
			-0.046491, 0.161126, 0.000000,
			-0.038961, 0.177952, 0.000000,
			-0.029083, 0.191065, 0.000000,
			-0.017091, 0.200909, 0.000000,
			-0.003187, 0.207943, 0.000000,
			0.012630, 0.212161, 0.000000,
			0.030361, 0.213570, 0.000000,
			0.048230, 0.212222, 0.000000,
			0.064057, 0.208204, 0.000000,
			0.077848, 0.201509, 0.000000,
			0.089587, 0.192126, 0.000000,
			0.098970, 0.180248, 0.000000,
			0.105665, 0.166065, 0.000000,
			0.109691, 0.149570, 0.000000,
			0.111030, 0.130770, 0.000000,
			0.109491, 0.112674, 0.000000,
			0.104874, 0.094465, 0.000000,
			0.097178, 0.076161, 0.000000,
			0.086404, 0.057743, 0.000000,
			0.073370, 0.041343, 0.000000,
			0.052543, 0.018891, 0.000000,
			0.023909, -0.009613, 0.000000,
			0.005691, -0.026883, 0.000000,
			-0.012526, -0.044161, 0.000000,
			-0.035509, -0.066257, 0.000000,
			-0.058491, -0.088361, 0.000000,
			-0.077326, -0.108161, 0.000000,
			-0.096170, -0.127970, 0.000000,
			-0.125578, -0.162978, 0.000000,
			-0.146700, -0.193404, 0.000000,
			-0.161987, -0.221943, 0.000000,
			-0.173874, -0.251309, 0.000000,
			-0.182361, -0.281500, 0.000000,
			-0.187457, -0.312500, 0.000000,
			0.230761, -0.312500, 0.000000,
			0.230761, -0.201683, 0.000000,
			-0.006161, -0.201683, 0.000000,
			-0.001126, -0.193570, 0.000000,
			0.004613, -0.185335, 0.000000,
			0.011074, -0.177004, 0.000000,
			0.018257, -0.168570, 0.000000,
			0.028378, -0.157900, 0.000000,
			0.043683, -0.142883, 0.000000,
			0.064152, -0.123509, 0.000000,
			0.089804, -0.099787, 0.000000,
			0.115857, -0.075396, 0.000000,
			0.137570, -0.054030, 0.000000,
			0.154926, -0.035700, 0.000000,
			0.167926, -0.020387, 0.000000,
			0.183170, 0.000196, 0.000000,
			0.196213, 0.020326, 0.000000,
			0.207057, 0.040004, 0.000000,
			0.215691, 0.059230, 0.000000,
			0.222283, 0.078483, 0.000000,
			0.226996, 0.098239, 0.000000,
			0.229822, 0.118500, 0.000000,
			0.230761, 0.139265, 0.000000,
			0.227474, 0.174691, 0.000000,
			0.217604, 0.207091, 0.000000,
			0.201152, 0.236465, 0.000000,
			0.178117, 0.262822, 0.000000,
			0.149326, 0.284552, 0.000000,
			0.115596, 0.300074, 0.000000,
			0.076926, 0.309387, 0.000000
		];
		this.indices = [
			48, 49, 47,
			47, 49, 46,
			46, 49, 45,
			45, 49, 44,
			44, 49, 43,
			10, 11, 9,
			50, 51, 49,
			49, 51, 43,
			43, 51, 42,
			51, 52, 42,
			42, 52, 41,
			52, 53, 41,
			53, 54, 41,
			41, 54, 40,
			54, 55, 40,
			55, 56, 40,
			40, 56, 39,
			56, 57, 39,
			39, 57, 38,
			57, 58, 38,
			38, 58, 37,
			58, 59, 37,
			37, 59, 36,
			59, 60, 36,
			36, 60, 35,
			60, 61, 35,
			35, 61, 34,
			61, 62, 34,
			62, 63, 34,
			34, 63, 33,
			63, 64, 33,
			13, 14, 12,
			33, 64, 32,
			64, 65, 32,
			65, 66, 32,
			32, 66, 31,
			66, 67, 31,
			67, 68, 31,
			31, 68, 30,
			68, 69, 30,
			69, 70, 30,
			30, 70, 29,
			70, 71, 29,
			71, 72, 29,
			29, 72, 28,
			72, 73, 28,
			28, 73, 27,
			73, 74, 27,
			27, 74, 26,
			74, 75, 26,
			26, 75, 25,
			75, 76, 25,
			76, 77, 25,
			25, 77, 24,
			77, 78, 24,
			24, 78, 23,
			23, 78, 22,
			78, 1, 22,
			22, 1, 21,
			1, 2, 21,
			21, 2, 20,
			2, 3, 20,
			20, 3, 19,
			3, 4, 19,
			19, 4, 18,
			4, 5, 18,
			18, 5, 17,
			5, 6, 17,
			17, 6, 16,
			6, 7, 16,
			16, 7, 15,
			7, 8, 15,
			15, 8, 14,
			14, 8, 12,
			12, 8, 11,
			8, 9, 11
		];
		this.VAO = 0;
		this.VBO = 0;
		this.IBO = 0;
	}
};

export class threeTemplate {
	vertices;
	indices;
	VAO;
	VBO;
	IBO;
	constructor() {
		this.vertices = [
			0, 0, 0,
			0.026743, 0.312500, 0.000000,
			0.001683, 0.311291, 0.000000,
			-0.022135, 0.307665, 0.000000,
			-0.044709, 0.301630, 0.000000,
			-0.066030, 0.293178, 0.000000,
			-0.085587, 0.282613, 0.000000,
			-0.102865, 0.270248, 0.000000,
			-0.117857, 0.256074, 0.000000,
			-0.130570, 0.240100, 0.000000,
			-0.141404, 0.221804, 0.000000,
			-0.150787, 0.200665, 0.000000,
			-0.158709, 0.176691, 0.000000,
			-0.165170, 0.149874, 0.000000,
			-0.128517, 0.143648, 0.000000,
			-0.091857, 0.137422, 0.000000,
			-0.055204, 0.131196, 0.000000,
			-0.051804, 0.150352, 0.000000,
			-0.046283, 0.167074, 0.000000,
			-0.038648, 0.181352, 0.000000,
			-0.028883, 0.193187, 0.000000,
			-0.017491, 0.202474, 0.000000,
			-0.004996, 0.209109, 0.000000,
			0.008622, 0.213091, 0.000000,
			0.023343, 0.214413, 0.000000,
			0.038074, 0.213248, 0.000000,
			0.051265, 0.209743, 0.000000,
			0.062917, 0.203909, 0.000000,
			0.073022, 0.195735, 0.000000,
			0.081196, 0.185596, 0.000000,
			0.087039, 0.173865, 0.000000,
			0.090535, 0.160543, 0.000000,
			0.091709, 0.145630, 0.000000,
			0.090117, 0.128074, 0.000000,
			0.085335, 0.112352, 0.000000,
			0.077378, 0.098465, 0.000000,
			0.066230, 0.086404, 0.000000,
			0.052057, 0.076726, 0.000000,
			0.035022, 0.070004, 0.000000,
			0.015117, 0.066222, 0.000000,
			-0.007648, 0.065387, 0.000000,
			-0.012039, 0.032970, 0.000000,
			-0.016422, 0.000561, 0.000000,
			-0.020813, -0.031848, 0.000000,
			-0.005448, -0.027952, 0.000000,
			0.008804, -0.025161, 0.000000,
			0.021943, -0.023491, 0.000000,
			0.033961, -0.022935, 0.000000,
			0.050709, -0.024578, 0.000000,
			0.066126, -0.029517, 0.000000,
			0.080213, -0.037743, 0.000000,
			0.092978, -0.049257, 0.000000,
			0.103570, -0.063587, 0.000000,
			0.111135, -0.080257, 0.000000,
			0.115665, -0.099257, 0.000000,
			0.117178, -0.120587, 0.000000,
			0.115604, -0.143143, 0.000000,
			0.110865, -0.163257, 0.000000,
			0.102970, -0.180935, 0.000000,
			0.091917, -0.196170, 0.000000,
			0.078561, -0.208430, 0.000000,
			0.063735, -0.217187, 0.000000,
			0.047457, -0.222439, 0.000000,
			0.029717, -0.224187, 0.000000,
			0.013152, -0.222726, 0.000000,
			-0.002126, -0.218352, 0.000000,
			-0.016143, -0.211057, 0.000000,
			-0.028883, -0.200839, 0.000000,
			-0.039813, -0.187857, 0.000000,
			-0.048413, -0.172283, 0.000000,
			-0.054674, -0.154109, 0.000000,
			-0.058596, -0.133326, 0.000000,
			-0.097100, -0.137996, 0.000000,
			-0.174091, -0.147335, 0.000000,
			-0.166709, -0.184743, 0.000000,
			-0.153500, -0.218404, 0.000000,
			-0.134439, -0.248326, 0.000000,
			-0.109552, -0.274500, 0.000000,
			-0.079935, -0.295770, 0.000000,
			-0.046709, -0.310961, 0.000000,
			-0.009874, -0.320074, 0.000000,
			0.030561, -0.323109, 0.000000,
			0.073317, -0.319500, 0.000000,
			0.112404, -0.308683, 0.000000,
			0.147830, -0.290639, 0.000000,
			0.179596, -0.265378, 0.000000,
			0.205787, -0.234987, 0.000000,
			0.224500, -0.201578, 0.000000,
			0.235726, -0.165143, 0.000000,
			0.239465, -0.125683, 0.000000,
			0.237457, -0.098483, 0.000000,
			0.231448, -0.073352, 0.000000,
			0.221430, -0.050291, 0.000000,
			0.207404, -0.029300, 0.000000,
			0.190039, -0.011126, 0.000000,
			0.169987, 0.003500, 0.000000,
			0.147265, 0.014561, 0.000000,
			0.121848, 0.022074, 0.000000,
			0.161048, 0.048561, 0.000000,
			0.189048, 0.079178, 0.000000,
			0.205839, 0.113943, 0.000000,
			0.211439, 0.152848, 0.000000,
			0.208709, 0.180978, 0.000000,
			0.200509, 0.207622, 0.000000,
			0.186839, 0.232778, 0.000000,
			0.167709, 0.256448, 0.000000,
			0.138996, 0.280970, 0.000000,
			0.105926, 0.298483, 0.000000,
			0.068509, 0.308996, 0.000000
		];
		this.indices = [
			43, 44, 42,
			13, 14, 12,
			73, 74, 72,
			16, 17, 15,
			71, 72, 70,
			40, 41, 39,
			44, 45, 42,
			74, 75, 72,
			72, 75, 70,
			70, 75, 69,
			75, 76, 69,
			69, 76, 68,
			76, 77, 68,
			68, 77, 67,
			77, 78, 67,
			67, 78, 66,
			78, 79, 66,
			66, 79, 65,
			79, 80, 65,
			65, 80, 64,
			80, 81, 64,
			64, 81, 63,
			81, 82, 63,
			63, 82, 62,
			82, 83, 62,
			62, 83, 61,
			83, 60, 61,
			83, 84, 60,
			84, 59, 60,
			84, 85, 59,
			59, 85, 58,
			85, 86, 58,
			86, 87, 58,
			58, 87, 57,
			87, 88, 57,
			57, 88, 56,
			88, 89, 56,
			56, 89, 55,
			89, 90, 55,
			55, 90, 54,
			90, 91, 54,
			91, 92, 54,
			54, 92, 53,
			92, 93, 53,
			93, 94, 53,
			53, 94, 52,
			94, 95, 52,
			95, 96, 52,
			52, 96, 51,
			96, 97, 51,
			51, 97, 50,
			50, 97, 49,
			12, 14, 11,
			49, 97, 48,
			14, 15, 11,
			11, 15, 10,
			15, 17, 10,
			17, 18, 10,
			10, 18, 9,
			18, 19, 9,
			9, 19, 8,
			19, 20, 8,
			8, 20, 7,
			7, 20, 6,
			20, 21, 6,
			6, 21, 5,
			5, 21, 4,
			21, 22, 4,
			4, 22, 3,
			22, 23, 3,
			3, 23, 2,
			2, 23, 1,
			23, 24, 1,
			1, 24, 108,
			24, 25, 108,
			25, 26, 108,
			108, 26, 107,
			26, 27, 107,
			107, 27, 106,
			27, 28, 106,
			106, 28, 105,
			28, 29, 105,
			105, 29, 104,
			29, 30, 104,
			104, 30, 103,
			103, 30, 102,
			30, 31, 102,
			102, 31, 101,
			31, 32, 101,
			101, 32, 100,
			32, 33, 100,
			100, 33, 99,
			99, 33, 98,
			33, 34, 98,
			98, 34, 97,
			34, 35, 97,
			35, 36, 97,
			97, 36, 48,
			36, 37, 48,
			37, 38, 48,
			48, 38, 47,
			38, 39, 47,
			39, 41, 47,
			41, 42, 47,
			47, 42, 46,
			42, 45, 46
		];
		this.VAO = 0;
		this.VBO = 0;
		this.IBO = 0;
	}
};

// only made once and reused to draw multiple lines
export class lineTemplate {
	vertices;
	indices;
	VAO;
	VBO;
	IBO;
	constructor() {
		this.vertices = [
			-1.0, -0.5, 0.0,
			1.0, -0.5, 0.0,
			1.0, 0.5, 0.0,
			-1.0, 0.5, 0.0
		];
		this.indices = [
			0, 1, 2,
			2, 3, 0
		];
		
		this.VAO = 0;
		this.VBO = 0;
		this.IBO = 0;

	}
};

export class crossTemplate {
	vertices;
	indices;
	VAO;
	VBO;
	IBO;
	constructor() {
		this.vertices = [
			0.000000, 0.000000, 0.000000,
			0.171254, 0.327603, 0.000000,
			0.164927, 0.327328, 0.000000,
			0.158996, 0.326500, 0.000000,
			0.153461, 0.325121, 0.000000,
			0.148315, 0.323190, 0.000000,
			0.143487, 0.320698, 0.000000,
			0.138901, 0.317664, 0.000000,
			0.134547, 0.314069, 0.000000,
			0.130427, 0.309922, 0.000000,
			0.126392, 0.305216, 0.000000,
			0.122272, 0.299931, 0.000000,
			0.118073, 0.294060, 0.000000,
			0.113797, 0.287621, 0.000000,
			0.109263, 0.280543, 0.000000,
			0.104280, 0.272776, 0.000000,
			0.098841, 0.264336, 0.000000,
			0.092961, 0.255207, 0.000000,
			-0.005953, 0.105353, 0.000000,
			-0.098556, 0.255207, 0.000000,
			-0.110703, 0.274397, 0.000000,
			-0.121444, 0.290302, 0.000000,
			-0.130797, 0.302914, 0.000000,
			-0.138763, 0.312241, 0.000000,
			-0.146746, 0.318966, 0.000000,
			-0.156177, 0.323767, 0.000000,
			-0.167056, 0.326647, 0.000000,
			-0.179375, 0.327603, 0.000000,
			-0.190306, 0.326724, 0.000000,
			-0.200375, 0.324078, 0.000000,
			-0.209565, 0.319672, 0.000000,
			-0.217892, 0.313500, 0.000000,
			-0.224797, 0.306233, 0.000000,
			-0.229728, 0.298509, 0.000000,
			-0.232694, 0.290336, 0.000000,
			-0.233677, 0.281724, 0.000000,
			-0.233168, 0.273000, 0.000000,
			-0.231625, 0.264095, 0.000000,
			-0.229065, 0.255009, 0.000000,
			-0.225470, 0.245733, 0.000000,
			-0.220858, 0.235905, 0.000000,
			-0.215211, 0.225164, 0.000000,
			-0.208539, 0.213491, 0.000000,
			-0.200849, 0.200905, 0.000000,
			-0.084668, 0.021586, 0.000000,
			-0.222737, -0.180034, 0.000000,
			-0.236177, -0.201690, 0.000000,
			-0.245780, -0.221603, 0.000000,
			-0.251539, -0.239784, 0.000000,
			-0.253461, -0.256224, 0.000000,
			-0.252530, -0.268698, 0.000000,
			-0.249728, -0.279586, 0.000000,
			-0.245056, -0.288905, 0.000000,
			-0.238522, -0.296638, 0.000000,
			-0.230565, -0.302707, 0.000000,
			-0.221634, -0.307043, 0.000000,
			-0.211728, -0.309647, 0.000000,
			-0.200849, -0.310517, 0.000000,
			-0.193720, -0.310233, 0.000000,
			-0.187065, -0.309362, 0.000000,
			-0.180875, -0.307914, 0.000000,
			-0.175168, -0.305888, 0.000000,
			-0.169884, -0.303362, 0.000000,
			-0.164961, -0.300414, 0.000000,
			-0.160409, -0.297060, 0.000000,
			-0.156228, -0.293267, 0.000000,
			-0.152375, -0.289241, 0.000000,
			-0.148806, -0.285164, 0.000000,
			-0.145530, -0.281034, 0.000000,
			-0.142547, -0.276853, 0.000000,
			-0.139220, -0.271853, 0.000000,
			-0.134918, -0.265276, 0.000000,
			-0.129642, -0.257121, 0.000000,
			-0.123392, -0.247388, 0.000000,
			-0.008056, -0.071440, 0.000000,
			0.100539, -0.242336, 0.000000,
			0.110039, -0.256836, 0.000000,
			0.117901, -0.268750, 0.000000,
			0.124142, -0.278086, 0.000000,
			0.128746, -0.284853, 0.000000,
			0.132823, -0.290103, 0.000000,
			0.137478, -0.294897, 0.000000,
			0.142711, -0.299259, 0.000000,
			0.148530, -0.303155, 0.000000,
			0.154970, -0.306379, 0.000000,
			0.162099, -0.308681, 0.000000,
			0.169918, -0.310060, 0.000000,
			0.178409, -0.310517, 0.000000,
			0.186409, -0.310069, 0.000000,
			0.193987, -0.308733, 0.000000,
			0.201142, -0.306491, 0.000000,
			0.207875, -0.303362, 0.000000,
			0.214039, -0.299474, 0.000000,
			0.219453, -0.294957, 0.000000,
			0.224134, -0.289793, 0.000000,
			0.228082, -0.284009, 0.000000,
			0.231211, -0.277750, 0.000000,
			0.233453, -0.271172, 0.000000,
			0.234789, -0.264276, 0.000000,
			0.235237, -0.257069, 0.000000,
			0.234737, -0.249164, 0.000000,
			0.233237, -0.241017, 0.000000,
			0.230737, -0.232638, 0.000000,
			0.227246, -0.224026, 0.000000,
			0.222634, -0.214724, 0.000000,
			0.216823, -0.204293, 0.000000,
			0.209797, -0.192733, 0.000000,
			0.201565, -0.180034, 0.000000,
			0.070651, 0.021586, 0.000000,
			0.192306, 0.203431, 0.000000,
			0.206487, 0.226371, 0.000000,
			0.216616, 0.246785, 0.000000,
			0.222694, 0.264672, 0.000000,
			0.224720, 0.280043, 0.000000,
			0.223780, 0.289397, 0.000000,
			0.220978, 0.298086, 0.000000,
			0.216315, 0.306121, 0.000000,
			0.209772, 0.313500, 0.000000,
			0.201763, 0.319672, 0.000000,
			0.192677, 0.324078, 0.000000,
			0.182504, 0.326724, 0.000000
		];
		this.indices = [
			1, 2, 120,
			2, 3, 120,
			120, 3, 119,
			119, 3, 118,
			118, 3, 117,
			117, 3, 116,
			116, 3, 115,
			115, 3, 114,
			114, 3, 113,
			113, 3, 112,
			112, 3, 111,
			3, 4, 111,
			4, 5, 111,
			5, 6, 111,
			6, 7, 111,
			7, 8, 111,
			8, 9, 111,
			9, 10, 111,
			10, 11, 111,
			111, 11, 110,
			11, 12, 110,
			12, 13, 110,
			13, 14, 110,
			110, 14, 109,
			14, 15, 109,
			15, 16, 109,
			16, 17, 109,
			109, 17, 108,
			17, 18, 108,
			19, 20, 18,
			20, 21, 18,
			21, 22, 18,
			22, 23, 18,
			23, 24, 18,
			24, 25, 18,
			25, 26, 18,
			26, 27, 18,
			27, 28, 18,
			28, 29, 18,
			29, 30, 18,
			30, 31, 18,
			31, 32, 18,
			32, 33, 18,
			33, 34, 18,
			34, 35, 18,
			35, 36, 18,
			36, 37, 18,
			37, 38, 18,
			38, 39, 18,
			39, 40, 18,
			40, 41, 18,
			41, 42, 18,
			42, 43, 18,
			43, 44, 18,
			18, 44, 108,
			108, 44, 107,
			107, 44, 106,
			106, 44, 105,
			105, 44, 104,
			104, 44, 103,
			103, 44, 102,
			102, 44, 101,
			101, 44, 100,
			100, 44, 99,
			99, 44, 98,
			98, 44, 97,
			97, 44, 96,
			96, 44, 95,
			95, 44, 94,
			94, 44, 93,
			93, 44, 92,
			92, 44, 91,
			91, 44, 90,
			90, 44, 89,
			45, 46, 44,
			46, 47, 44,
			47, 48, 44,
			48, 49, 44,
			49, 50, 44,
			50, 51, 44,
			51, 52, 44,
			52, 53, 44,
			53, 54, 44,
			54, 55, 44,
			55, 56, 44,
			56, 57, 44,
			57, 58, 44,
			58, 59, 44,
			59, 60, 44,
			60, 61, 44,
			61, 62, 44,
			62, 63, 44,
			63, 64, 44,
			64, 65, 44,
			65, 66, 44,
			66, 67, 44,
			67, 68, 44,
			68, 69, 44,
			69, 70, 44,
			70, 71, 44,
			71, 72, 44,
			72, 73, 44,
			73, 74, 44,
			44, 74, 89,
			74, 75, 89,
			75, 76, 89,
			76, 77, 89,
			77, 78, 89,
			78, 79, 89,
			79, 80, 89,
			80, 81, 89,
			89, 81, 88,
			81, 82, 88,
			82, 83, 88,
			88, 83, 87,
			83, 84, 87,
			84, 85, 87,
			85, 86, 87

		];
		
		this.VAO = 0;
		this.VBO = 0;
		this.IBO = 0;

	}
};

export class shadeCellTemplate {
	vertices;
	indices;
	VAO;
	VBO;
	IBO;
	constructor() {
		this.vertices = [
			-1.0, -1.0, 0.0,
			1.0, -1.0, 0.0,
			1.0, 1.0, 0.0,
			-1.0, 1.0, 0.0
		];
		this.indices = [
			0, 1, 2,
			2, 3, 0
		];
		
		this.VAO = 0;
		this.VBO = 0;
		this.IBO = 0;

	}
};

// data for a single object. Can be a line, or circle, or later on can be numbers, or X's
export class graphicsObj {
	modelMatrix;		// matrix that holds transformation, rotation, and scale info
	translate;
	rotate;
	scale;
	color;
	type;				// 1 for dot, 2 for line/cross, 3 for cell number, 4 for shade cell
	display;			// for lines: 0 for nothing, 1 for line, 2 for X. for cells: do the number. For shade cell: 0 for off, 1 for on
	
	//xWorld;
	//yWorld;
	worldCoords;
	xLowerBound;
	xUpperBound;
	yLowerBound;
	yUpperBound;

	xCoord;				//	coords in line array to determine if a 
	yCoord;				// 		line should be drawn or not
	constructor() {
		this.modelMatrix = glMatrix.mat4.create();
		this.translate = glMatrix.mat4.create();
		this.rotate = glMatrix.mat4.create();
		this.scale = glMatrix.mat4.create();
		this.color = [0.439, 0.329, 0.302];
		this.type = -1;
		this.xCoord = -1;
		this.yCoord = -1;
		this.worldCoords = Array(2);
	}
};

// function that initializes and returns an instance of the dot template
export var getDot = function(gl, program) {
	var newDot = new circleTemplate();

	newDot.VAO = gl.createVertexArray();
	//console.log("here");
	gl.bindVertexArray(newDot.VAO);
	
	newDot.VBO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, newDot.VBO);

	// new Float32Array(verticies) --> webGL expects 32 bit, JS encodes as 64 bit
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newDot.vertices), gl.STATIC_DRAW);
	
	var posAttribLoc = gl.getAttribLocation(program, "vertPos");
	gl.vertexAttribPointer(posAttribLoc, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT,	0);
	
	gl.enableVertexAttribArray(posAttribLoc);
	
	newDot.IBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, newDot.IBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(newDot.indices), gl.STATIC_DRAW);

	//console.log("newDot has been pushed");
	return newDot;
	
}

// function that initializes and returns an instance of the line template
export var getLine = function(gl, program) {
	var newLine = new lineTemplate();

	newLine.VAO = gl.createVertexArray();
	gl.bindVertexArray(newLine.VAO);
	
	newLine.VBO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, newLine.VBO);

	// new Float32Array(verticies) --> webGL expects 32 bit, JS encodes as 64 bit
	// gl.STATIC_DRAW --> triangle shape will not change at all after being drawn
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newLine.vertices), gl.STATIC_DRAW);
	
	var posAttribLoc = gl.getAttribLocation(program, "vertPos");
	gl.vertexAttribPointer(posAttribLoc, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT,	0);
	
	gl.enableVertexAttribArray(posAttribLoc);
	
	newLine.IBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, newLine.IBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(newLine.indices), gl.STATIC_DRAW);
	
	//console.log("newLine has been pushed");
	return newLine;
}

export var getZero = function(gl, program) {
	var newZero = new zeroTemplate();

	newZero.VAO = gl.createVertexArray();
	gl.bindVertexArray(newZero.VAO);
	
	newZero.VBO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, newZero.VBO);

	// new Float32Array(verticies) --> webGL expects 32 bit, JS encodes as 64 bit
	// gl.STATIC_DRAW --> triangle shape will not change at all after being drawn
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newZero.vertices), gl.STATIC_DRAW);
	
	var posAttribLoc = gl.getAttribLocation(program, "vertPos");
	gl.vertexAttribPointer(posAttribLoc, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT,	0);
	
	gl.enableVertexAttribArray(posAttribLoc);
	
	newZero.IBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, newZero.IBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(newZero.indices), gl.STATIC_DRAW);
	
	//console.log("newZero has been pushed");
	return newZero;

}

export var getOne = function(gl, program) {
	var newOne = new oneTemplate();

	newOne.VAO = gl.createVertexArray();
	gl.bindVertexArray(newOne.VAO);
	
	newOne.VBO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, newOne.VBO);

	// new Float32Array(verticies) --> webGL expects 32 bit, JS encodes as 64 bit
	// gl.STATIC_DRAW --> triangle shape will not change at all after being drawn
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newOne.vertices), gl.STATIC_DRAW);
	
	var posAttribLoc = gl.getAttribLocation(program, "vertPos");
	gl.vertexAttribPointer(posAttribLoc, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT,	0);
	
	gl.enableVertexAttribArray(posAttribLoc);
	
	newOne.IBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, newOne.IBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(newOne.indices), gl.STATIC_DRAW);
	
	//console.log("newOne has been pushed");
	return newOne;

}

export var getTwo = function(gl, program) {
	var newTwo = new twoTemplate();

	newTwo.VAO = gl.createVertexArray();
	gl.bindVertexArray(newTwo.VAO);
	
	newTwo.VBO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, newTwo.VBO);

	// new Float32Array(verticies) --> webGL expects 32 bit, JS encodes as 64 bit
	// gl.STATIC_DRAW --> triangle shape will not change at all after being drawn
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newTwo.vertices), gl.STATIC_DRAW);
	
	var posAttribLoc = gl.getAttribLocation(program, "vertPos");
	gl.vertexAttribPointer(posAttribLoc, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT,	0);
	
	gl.enableVertexAttribArray(posAttribLoc);
	
	newTwo.IBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, newTwo.IBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(newTwo.indices), gl.STATIC_DRAW);
	
	//console.log("newTwo has been pushed");
	return newTwo;

}

export var getThree = function(gl, program) {
	var newThree = new threeTemplate();

	newThree.VAO = gl.createVertexArray();
	gl.bindVertexArray(newThree.VAO);
	
	newThree.VBO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, newThree.VBO);

	// new Float32Array(verticies) --> webGL expects 32 bit, JS encodes as 64 bit
	// gl.STATIC_DRAW --> triangle shape will not change at all after being drawn
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newThree.vertices), gl.STATIC_DRAW);
	
	var posAttribLoc = gl.getAttribLocation(program, "vertPos");
	gl.vertexAttribPointer(posAttribLoc, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT,	0);
	
	gl.enableVertexAttribArray(posAttribLoc);
	
	newThree.IBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, newThree.IBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(newThree.indices), gl.STATIC_DRAW);
	
	//console.log("newThree has been pushed");
	return newThree;

}

export var getCross = function(gl, program) {
	var newCross = new crossTemplate();

	newCross.VAO = gl.createVertexArray();
	gl.bindVertexArray(newCross.VAO);
	
	newCross.VBO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, newCross.VBO);

	// new Float32Array(verticies) --> webGL expects 32 bit, JS encodes as 64 bit
	// gl.STATIC_DRAW --> triangle shape will not change at all after being drawn
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newCross.vertices), gl.STATIC_DRAW);
	
	var posAttribLoc = gl.getAttribLocation(program, "vertPos");
	gl.vertexAttribPointer(posAttribLoc, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT,	0);
	
	gl.enableVertexAttribArray(posAttribLoc);
	
	newCross.IBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, newCross.IBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(newCross.indices), gl.STATIC_DRAW);
	
	//console.log("newCross has been pushed");
	return newCross;

}

export var getBox = function(gl, program) {
	var newBox = new shadeCellTemplate();

	newBox.VAO = gl.createVertexArray();
	gl.bindVertexArray(newBox.VAO);
	
	newBox.VBO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, newBox.VBO);

	// new Float32Array(verticies) --> webGL expects 32 bit, JS encodes as 64 bit
	// gl.STATIC_DRAW --> triangle shape will not change at all after being drawn
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(newBox.vertices), gl.STATIC_DRAW);
	
	var posAttribLoc = gl.getAttribLocation(program, "vertPos");
	gl.vertexAttribPointer(posAttribLoc, 3, gl.FLOAT, gl.FALSE, 3 * Float32Array.BYTES_PER_ELEMENT,	0);
	
	gl.enableVertexAttribArray(posAttribLoc);
	
	newBox.IBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, newBox.IBO);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(newBox.indices), gl.STATIC_DRAW);
	
	//console.log("newBox has been pushed");
	return newBox;
}

// update graphic state to match logic state
export var updateGraphicPuzzleState = function(puzzle, gLinesArray, cellShades){
	// iterate through nodes connections
	for (let i = 0; i < 2 * puzzle.h + 1; i++) {
		for (let j = 0; j < puzzle.w + 1; j++) {
			if (i%2 == 0){ // horizontal line
				if (pl.arrayIndexOf(puzzle.nodes[i/2][j], [i/2, j+1, 1]) != -1){ // line exists
					gLinesArray[i][j] = 1;
				} else if (pl.arrayIndexOf(puzzle.nodes[i/2][j], [i/2, j+1, 0]) != -1){ // cross exists
					gLinesArray[i][j] = 2;
				} else { // no connection
					gLinesArray[i][j] = 0;
				}
			} else if (i%2 == 1){ // vertical line
				if (pl.arrayIndexOf(puzzle.nodes[(i+1)/2][j], [((i+1)/2)-1, j, 1]) != -1) { // line exists
					gLinesArray[i][j] = 1;
				} else if (pl.arrayIndexOf(puzzle.nodes[(i+1)/2][j], [((i+1)/2)-1, j, 0]) != -1) { // cross exists
					gLinesArray[i][j] = 2;
				} else { // no connection
					gLinesArray[i][j] = 0;
				}
			}
		}	
	}
	
	// iterate through cells
	for (let i = 0; i < puzzle.w * puzzle.h; i++){
		let x = Math.floor(i/puzzle.w);
		let y = i%puzzle.h;
		if (puzzle.cells[x][y][1] == true){
			cellShades[i].display = 1;
		} else {
			cellShades[i].display = 0;
		}
	}
}

// updates a logical line to sync with graphics
export var updateLogicConnection = function(puzzle, gLinesArray, i, j){
	if (i % 2 == 0){ // horizonatal conn
		switch(gLinesArray[i][j]){
			case 1: // line
				pl.placeLine(puzzle, i/2, j, i/2, j+1);
				break;
			case 2: // cross
				pl.placeCross(puzzle, i/2, j, i/2, j+1);
				break;
			default: // remove connection
				pl.removeLine(puzzle, i/2, j, i/2, j+1);
		}
	} else { // vertical conn
		switch(gLinesArray[i][j]){
			case 1: // line
				pl.placeLine(puzzle, (i+1)/2, j, ((i+1)/2)-1, j);
				break;
			case 2: // cross
				pl.placeCross(puzzle, (i+1)/2, j, ((i+1)/2)-1, j);
				break;
			default: // remove connection
				pl.removeLine(puzzle, (i+1)/2, j, ((i+1)/2)-1, j);
		}
	}

}