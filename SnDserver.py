# demo modules
from __future__ import print_function
from tornado import escape
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.options import define, options
from tornado.web import Application, RequestHandler, StaticFileHandler
import json
import os
import random
import numpy as np
import string
import time
import base64

# mixnmatch modules
from config import cfg
import os
import time
from PIL import Image
import torch.backends.cudnn as cudnn
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision.utils as vutils
from tensorboardX import SummaryWriter
from model_eval import G_NET, Encoder, FeatureExtractor
import torchvision.transforms as transforms
import random
import torch.nn.functional as F
from utils import *
import pdb
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
from random import sample
import argparse

device = torch.device("cuda:" + cfg.GPU_ID)
gpus = [int(ix) for ix in cfg.GPU_ID.split(',')]
os.environ["CUDA_VISIBLE_DEVICES"] = "1"


def load_network(names):
    "load pretrained generator and encoder"
    # prepare G net
    netG = G_NET().to(device)
    netG = torch.nn.DataParallel(netG, device_ids=gpus)
    state_dict = torch.load(names[0])
    netG.load_state_dict(state_dict)

    # prepare encoder
    encoder = Encoder().to(device)
    encoder = torch.nn.DataParallel(encoder, device_ids=gpus)
    state_dict = torch.load(names[1])
    encoder.load_state_dict(state_dict)

    extractor = FeatureExtractor(3,16)
    extractor = torch.nn.DataParallel(extractor, device_ids=gpus)
    extractor.load_state_dict(torch.load(names[2]))
    extractor.to(device)

    return netG.eval(), encoder.eval(), extractor.eval()

def get_images(fire, size=[128, 128]):
    transform = transforms.Compose([transforms.Resize((size[0], size[1]))])
    normalize = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.5,0.5,0.5),(0.5,0.5,0.5))])
    img = Image.open(fire).convert('RGB')
    img = transform(img)
    img = normalize(img)
    return img.unsqueeze(0)

def save_img(img, file):
    img = img.cpu()
    vutils.save_image(img, file, scale_each=True, normalize=True)
    real_img_set = vutils.make_grid(img).numpy()
    real_img_set = np.transpose(real_img_set, (1, 2, 0))
    real_img_set = real_img_set * 255
    real_img_set = real_img_set.astype(np.uint8)



define('port', default=8005, help='run on the given port', type=int)

def weights_init(m):
    classname = m.__class__.__name__
    if classname.find('Conv') != -1:
        nn.init.orthogonal(m.weight.data, 1.0)
    elif classname.find('BatchNorm') != -1:
        m.weight.data.normal_(1.0, 0.02)
        m.bias.data.fill_(0)
    elif classname.find('Linear') != -1:
        nn.init.orthogonal(m.weight.data, 1.0)
        if m.bias is not None:
            m.bias.data.fill_(0.0)

MODELS = 'models/bird'
names = [os.path.join(MODELS,'G.pth'), os.path.join(MODELS,'E.pth'), os.path.join(MODELS,'EX.pth')]
netG, encoder, extractor = load_network(names)

print('model loaded')

def id_generator(size=6, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))

class App(Application):
    def __init__(self):
        handlers = [
            (r'/init', InitHandler),
            # (r'/switch.*', SwitchHandler),
            # (r'/query?.*', QueryHandler),
            (r"/code", CodeHandler),
            (r"/feature", featureHandler),
            (r'/(.*)', StaticFileHandler, {
                'path': './public',
                'default_filename': 'index.html'
            })
        ]
        Application.__init__(self, handlers)

class CodeHandler(RequestHandler):
    def post(self):
        data = escape.json_decode(self.request.body)
        uid = data['uid']

        bg_img_path = 'public/tmp_images/' + uid + '_bg.png'
        bg_img = data['bg_img'].split(',')[1]
        with open(bg_img_path, "wb") as f:
            f.write(base64.b64decode(bg_img))

        shp_img_path = 'public/tmp_images/' + uid + '_shp.png'
        shp_img = data['shp_img'].split(',')[1]
        with open(shp_img_path, "wb") as f:
            f.write(base64.b64decode(shp_img))

        txtr_img_path = 'public/tmp_images/' + uid + '_txtr.png'
        txtr_img = data['txtr_img'].split(',')[1]
        with open(txtr_img_path, "wb") as f:
            f.write(base64.b64decode(txtr_img))

        pose_img_path = 'public/tmp_images/' + uid + '_pose.png'
        pose_img = data['pose_img'].split(',')[1]
        with open(pose_img_path, "wb") as f:
            f.write(base64.b64decode(pose_img))

        real_img_z  = get_images(pose_img_path)
        real_img_b  = get_images(bg_img_path)
        real_img_p  = get_images(shp_img_path)
        real_img_c  = get_images(txtr_img_path)

        out_path = 'public/tmp_images/' + uid + '_out.png'

        with torch.no_grad():
            fake_z2, _, _, _ = encoder(real_img_z.to(device), 'softmax')
            fake_z1, fake_b, _, _ = encoder(real_img_b.to(device), 'softmax')
            _, _, fake_p, _ = encoder(real_img_p.to(device), 'softmax')
            _, _, _, fake_c = encoder(real_img_c.to(device), 'softmax')

            fake_imgs, _, _, _ = netG(fake_z1, fake_z2, fake_c, fake_p, fake_b, 'code')
            img = fake_imgs[2]

        save_img(img, out_path)

        self.write(json.dumps({'uid': uid}))
        self.finish()

class featureHandler(RequestHandler):
    def post(self):
        data = escape.json_decode(self.request.body)
        uid = data['uid']

        bg_img_path = 'public/tmp_images/' + uid + '_bg.png'
        bg_img = data['bg_img'].split(',')[1]
        with open(bg_img_path, "wb") as f:
            f.write(base64.b64decode(bg_img))

        shp_img_path = 'public/tmp_images/' + uid + '_shp.png'
        shp_img = data['shp_img'].split(',')[1]
        with open(shp_img_path, "wb") as f:
            f.write(base64.b64decode(shp_img))

        txtr_img_path = 'public/tmp_images/' + uid + '_txtr.png'
        txtr_img = data['txtr_img'].split(',')[1]
        with open(txtr_img_path, "wb") as f:
            f.write(base64.b64decode(txtr_img))

        real_img_b  = get_images(bg_img_path)
        real_img_p  = get_images(shp_img_path)
        real_img_c  = get_images(txtr_img_path)

        out_path = 'public/tmp_images/' + uid + '_out.png'

        with torch.no_grad():
            shape_feature = extractor(real_img_p.to(device))
            fake_z1, fake_b, _, _ = encoder(real_img_b.to(device), 'softmax')
            _, _, _, fake_c = encoder(real_img_c.to(device), 'softmax' )

            fake_imgs, _, _, _ = netG(fake_z1, None, fake_c, shape_feature, fake_b, 'feature')
            img = fake_imgs[2]

        save_img(img, out_path)

        self.write(json.dumps({'uid': uid}))
        self.finish()

class InitHandler(RequestHandler):
    def get(self):
        uid = id_generator() # generate user id
        self.write(json.dumps({'uid': uid}))
        self.finish()




# # class SwitchHandler(RequestHandler):
# #     def post(self):
# #         cid = escape.json_decode(self.request.body)
# #         cl = self.request.uri.split('2')[1]
# #         if cl == 'bird':
# #             net_G = B_netG
# #             super_class = const.B_SUPER_CLASS
# #             embedding_dim = const.B_EMBEDDING_DIM
# #             z_dim = const.B_Z_DIM
# #             num_z = const.B_NUM_Z
# #             noiseb_full = B_noiseb_full
# #             z_code_full = B_z_code_full
# #             bad_child_set = B_bad_child_set
# #         elif cl == 'car':
# #             net_G = C_netG
# #             super_class = const.C_SUPER_CLASS
# #             embedding_dim = const.C_EMBEDDING_DIM
# #             z_dim = const.C_Z_DIM
# #             num_z = const.C_NUM_Z
# #             noiseb_full = C_noiseb_full
# #             z_code_full = C_z_code_full
# #             bad_child_set = C_bad_child_set
# #         elif cl == 'dog':
# #             net_G = D_netG
# #             super_class = const.D_SUPER_CLASS
# #             embedding_dim = const.D_EMBEDDING_DIM
# #             z_dim = const.D_Z_DIM
# #             num_z = const.D_NUM_Z
# #             noiseb_full = D_noiseb_full
# #             z_code_full = D_z_code_full
# #             bad_child_set = D_bad_child_set

# #         z_ind = random.sample(range(num_z),1)[0]
# #         p_ind = random.sample(range(super_class),1)[0]
# #         b_ind = random.sample(range(embedding_dim),1)[0]
# #         c_ind = random.sample(range(embedding_dim),1)[0]
# #         while c_ind in bad_child_set:
# #             c_ind = random.sample(range(embedding_dim),1)[0]

# #         self.c_code = torch.zeros([num_intp, embedding_dim]).cuda()
# #         self.p_code = torch.zeros([num_intp, super_class]).cuda()
# #         self.z_code = torch.zeros([num_intp, z_dim]).cuda()
# #         self.noiseb = torch.zeros([num_intp, z_dim]).cuda()
# #         self.bg_code = torch.zeros_like(self.c_code).cuda()

# #         for my_it in range(num_intp):
# #             self.noiseb[my_it] = noiseb_full[0 : 0 + 1]
# #             self.z_code[my_it] = z_code_full[z_ind : z_ind + 1]

# #         self.bg_code[:,b_ind] = 1
# #         self.c_code[:,c_ind] = 1
# #         self.p_code[:,p_ind] = 1
# #         fake_imgs, _, _, _, mk, fg_mk = net_G(self.noiseb, self.z_code, self.bg_code, self.p_code, self.c_code)
# #         save_singleimages_vis_zc(fake_imgs[2], 'ds', 2, cid)
# #         data = {'id': cid, 'bid': b_ind, 'pid': p_ind, 'cid': c_ind, 'zid': z_ind}
# #         self.write(json.dumps(data))
# #         self.finish()


# class QueryHandler(RequestHandler):
#     def post(self):
#         _command = self.request.uri.split('?')[1]
#         cl = _command.split('-')[0]

#         net_G = B_netG
#         super_class = const.B_SUPER_CLASS
#         embedding_dim = const.B_EMBEDDING_DIM
#         z_dim = const.B_Z_DIM
#         num_z = const.B_NUM_Z
#         noiseb_full = B_noiseb_full
#         z_code_full = B_z_code_full
#         bad_child_set = B_bad_child_set

#         # if cl == 'bird':
#         #     net_G = B_netG
#         #     super_class = const.B_SUPER_CLASS
#         #     embedding_dim = const.B_EMBEDDING_DIM
#         #     z_dim = const.B_Z_DIM
#         #     num_z = const.B_NUM_Z
#         #     noiseb_full = B_noiseb_full
#         #     z_code_full = B_z_code_full
#         #     bad_child_set = B_bad_child_set
#         # elif cl == 'car':
#         #     net_G = C_netG
#         #     super_class = const.C_SUPER_CLASS
#         #     embedding_dim = const.C_EMBEDDING_DIM
#         #     z_dim = const.C_Z_DIM
#         #     num_z = const.C_NUM_Z
#         #     noiseb_full = C_noiseb_full
#         #     z_code_full = C_z_code_full
#         #     bad_child_set = C_bad_child_set
#         # elif cl == 'dog':
#         #     net_G = D_netG
#         #     super_class = const.D_SUPER_CLASS
#         #     embedding_dim = const.D_EMBEDDING_DIM
#         #     z_dim = const.D_Z_DIM
#         #     num_z = const.D_NUM_Z
#         #     noiseb_full = D_noiseb_full
#         #     z_code_full = D_z_code_full
#         #     bad_child_set = D_bad_child_set

#         self.p_code = torch.zeros([num_intp, super_class]).cuda()
#         self.bg_code = torch.zeros([num_intp, embedding_dim]).cuda()
#         self.c_code = torch.zeros([num_intp, embedding_dim]).cuda()
#         self.noisef = torch.zeros([num_intp, z_dim]).cuda()
#         self.noiseb = torch.zeros([num_intp, z_dim]).cuda()
#         data = escape.json_decode(self.request.body)

#         cid = data['id']
#         p_ind = data['pid']
#         b_ind = data['bid']
#         c_ind = data['cid']
#         z_ind = data['zid']
#         self.p_code[:, p_ind] = 1
#         self.bg_code[:, b_ind] = 1
#         self.c_code[:, c_ind] = 1

#         for my_it in range(num_intp):
#             self.noiseb[my_it] = noiseb_full[0 : 0 + 1]
#             self.noisef[my_it] = z_code_full[z_ind : z_ind + 1]

#         command = _command.split('-')[1]
#         if command == 'changep':
#             ind = torch.argmax(self.p_code[0])
#             self.p_code[:, ind] = 0
#             p_ind_old = p_ind

#             p_ind = random.sample(range(super_class), 1)[0]
#             while p_ind == p_ind_old:
#                 p_ind = random.sample(range(super_class), 1)[0]

#             self.p_code[:, p_ind] = 1
#             for my_it in range(num_intp):
#                 self.p_code[my_it, p_ind_old] = 1 - \
#                     (float(my_it)/(float(num_intp-1)))
#                 self.p_code[my_it, p_ind] = (float(my_it)/(float(num_intp-1)))
#             fake_imgs, _, _, _, mk, fg_mk = net_G(
#                 self.noiseb, self.noisef, self.bg_code, self.p_code, self.c_code)
#             save_singleimages_vis_zc(fake_imgs[2], 'ds', 2, cid)
#             data = {'id': cid, 'bid': b_ind,
#                     'pid': p_ind, 'cid': c_ind, 'zid': z_ind}
#             # print('pold:', p_ind_old, 'pnew:', p_ind)

#         elif command == 'changec':
#             ind = torch.argmax(self.c_code[0])
#             self.c_code[:, ind] = 0
#             c_ind_old = c_ind

#             c_ind = random.sample(range(embedding_dim), 1)[0]
#             while c_ind in bad_child_set or c_ind == c_ind_old:
#                 c_ind = random.sample(range(embedding_dim), 1)[0]

#             self.c_code[:, c_ind] = 1
#             for my_it in range(num_intp):
#                 self.c_code[my_it, c_ind_old] = 1 - \
#                     (float(my_it)/(float(num_intp-1)))
#                 self.c_code[my_it, c_ind] = (float(my_it) / (float(num_intp-1)))
#             fake_imgs, _, _, _, mk, fg_mk = net_G(
#                 self.noiseb, self.noisef, self.bg_code, self.p_code, self.c_code)
#             save_singleimages_vis_zc(fake_imgs[2], 'ds', 2, cid)
#             data = {'id': cid, 'bid': b_ind,
#                     'pid': p_ind, 'cid': c_ind, 'zid': z_ind}
#             # print('cold:', c_ind_old, 'cnew:', c_ind)

#         elif command == 'changeb':
#             ind = torch.argmax(self.bg_code[0])
#             self.bg_code[:, ind] = 0
#             b_ind_old = b_ind
#             b_ind = random.sample(range(embedding_dim), 1)[0]
#             while b_ind == b_ind_old:
#                 b_ind = random.sample(range(embedding_dim), 1)[0]

#             self.bg_code[:, b_ind] = 1
#             for my_it in range(num_intp):
#                 self.bg_code[my_it, b_ind_old] = 1 - \
#                     (float(my_it)/(float(num_intp-1)))
#                 self.bg_code[my_it, b_ind] = (float(my_it)/(float(num_intp-1)))
#             fake_imgs, _, _, _, mk, fg_mk = net_G(
#                 self.noiseb, self.noisef, self.bg_code, self.p_code, self.c_code)
#             save_singleimages_vis_zc(fake_imgs[2], 'ds', 2, cid)
#             data = {'id': cid, 'bid': b_ind,
#                     'pid': p_ind, 'cid': c_ind, 'zid': z_ind}

#         elif command == 'changez':
#             z_ind_old = z_ind
#             z_ind = random.sample(range(num_z), 1)[0]
#             while z_ind == z_ind_old:
#                 z_ind = random.sample(range(num_z), 1)[0]

#             for my_it in range(num_intp):
#                 self.noisef[my_it] = ((1-(float(my_it)/(float(num_intp-1)))) * z_code_full[z_ind_old: z_ind_old + 1]) + (
#                     ((float(my_it)/(float(num_intp-1)))) * z_code_full[z_ind: z_ind + 1])
#             fake_imgs, _, _, _, mk, fg_mk = net_G(
#                 self.noiseb, self.noisef, self.bg_code, self.p_code, self.c_code)
#             save_singleimages_vis_zc(fake_imgs[2], 'ds', 2, cid)
#             data = {'id': cid, 'bid': b_ind,
#                     'pid': p_ind, 'cid': c_ind, 'zid': z_ind}
#             # print('zold:', z_ind_old, 'znew:', z_ind)

#         elif command == 'reset':
#             z_ind_old = z_ind
#             p_ind_old = p_ind
#             c_ind_old = c_ind
#             b_ind_old = b_ind

#             z_ind = random.sample(range(num_z), 1)[0]
#             while z_ind == z_ind_old:
#                 z_ind = random.sample(range(num_z), 1)[0]

#             p_ind = random.sample(range(super_class), 1)[0]
#             while p_ind == p_ind_old:
#                 p_ind = random.sample(range(super_class), 1)[0]

#             b_ind = random.sample(range(embedding_dim), 1)[0]
#             while b_ind == b_ind_old:
#                 b_ind = random.sample(range(embedding_dim), 1)[0]

#             c_ind = random.sample(range(embedding_dim), 1)[0]
#             while c_ind == c_ind_old:
#                 c_ind = random.sample(range(embedding_dim), 1)[0]

#             self.c_code = torch.zeros([num_intp, embedding_dim]).cuda()
#             self.p_code = torch.zeros([num_intp, super_class]).cuda()
#             self.bg_code = torch.zeros_like(self.c_code).cuda()

#             for my_it in range(num_intp):
#                 self.noisef[my_it] = ((1-(float(my_it)/(float(num_intp-1)))) * z_code_full[z_ind_old : z_ind_old + 1]) + (
#                     ((float(my_it)/(float(num_intp-1)))) * z_code_full[z_ind : z_ind + 1])
#                 self.bg_code[my_it, b_ind_old] = 1 - \
#                     (float(my_it)/(float(num_intp-1)))
#                 self.bg_code[my_it, b_ind] = (float(my_it)/(float(num_intp-1)))
#                 self.p_code[my_it, p_ind_old] = 1 - \
#                     (float(my_it)/(float(num_intp-1)))
#                 self.p_code[my_it, p_ind] = (float(my_it)/(float(num_intp-1)))
#                 self.c_code[my_it, c_ind_old] = 1 - \
#                     (float(my_it)/(float(num_intp-1)))
#                 self.c_code[my_it, c_ind] = (float(my_it)/(float(num_intp-1)))

#             fake_imgs, _, _, _, mk, fg_mk = net_G(
#                 self.noiseb, self.noisef, self.bg_code, self.p_code, self.c_code)
#             save_singleimages_vis_zc(fake_imgs[2], 'ds', 2, cid)
#             data = {'id': cid, 'bid': b_ind,
#                     'pid': p_ind, 'cid': c_ind, 'zid': z_ind}

#         self.write(json.dumps(data))
#         self.finish()


def main():
    server = HTTPServer(App())
    server.listen(options.port)
    IOLoop.instance().start()

if __name__ == '__main__':
    main()
